-- Create or replace the function to get admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
    "totalMembers" BIGINT,
    "approvedMembers" BIGINT,
    "pendingMemberActions" BIGINT,
    "totalSavingsFund" NUMERIC,
    "activeLoanTotal" NUMERIC,
    "pendingLoansCount" BIGINT,
    "pendingPaymentsCount" BIGINT,
    "otherFundsTotal" NUMERIC,
    "paidThisMonth" BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM "members"),
        (SELECT COUNT(*) FROM "members" WHERE "status" = 'Approved'),
        (SELECT COUNT(*) FROM "members" WHERE "status" = 'Pending'),
        COALESCE((SELECT SUM(amount) FROM "transactions" WHERE "type" = 'MONTHLY_SAVINGS' AND "status" = 'Completed'), 0) - 
        COALESCE((SELECT ABS(SUM(amount)) FROM "transactions" WHERE "type" = 'LOAN_DISBURSEMENT' AND "status" = 'Completed'), 0),
        COALESCE((SELECT SUM(amount) FROM "loans" WHERE "loanStatus" = 'Active'), 0),
        (SELECT COUNT(*) FROM "loans" WHERE "applicationStatus" = 'Pending'),
        (SELECT COUNT(*) FROM "transactions" WHERE "status" = 'Pending'),
        COALESCE((SELECT SUM(amount) FROM "transactions" WHERE "type" = 'OTHER' AND "status" = 'Completed'), 0),
        (SELECT COUNT(DISTINCT "memberId") FROM "transactions" WHERE "type" = 'MONTHLY_SAVINGS' AND "status" = 'Completed' AND "paymentForMonth" = TO_CHAR(NOW(), 'YYYY-MM'));
END;
$$ LANGUAGE plpgsql;

-- Create or replace the function to get user loan data
CREATE OR REPLACE FUNCTION get_user_loan_data(p_clerk_id TEXT)
RETURNS TABLE (
    "hasLoan" BOOLEAN,
    "loanAmount" NUMERIC,
    "repaidAmount" NUMERIC,
    "repaymentPeriod" INT,
    "nextInstallmentDate" TEXT,
    "applicationPending" BOOLEAN,
    "loanApplicationsThisYear" BIGINT,
    "maxLoanableAmount" NUMERIC,
    "totalSavings" NUMERIC
) AS $$
DECLARE
    v_member_id UUID;
    v_active_loan RECORD;
    v_loans_this_year BIGINT;
    v_total_savings NUMERIC;
    v_max_loanable_amount NUMERIC;
    v_pending_application BOOLEAN;
    v_settings RECORD;
BEGIN
    SELECT "id" INTO v_member_id FROM "members" WHERE "clerkId" = p_clerk_id;

    IF v_member_id IS NULL THEN
        -- Return a row with default values if member not found
        RETURN QUERY SELECT FALSE, 0, 0, 0, 'N/A', FALSE, 0, 0, 0;
        RETURN;
    END IF;

    SELECT * INTO v_active_loan FROM "loans" WHERE "memberId" = v_member_id AND "loanStatus" = 'Active';
    SELECT COUNT(*) INTO v_loans_this_year FROM "loans" WHERE "memberId" = v_member_id AND "applicationDate" >= date_trunc('year', NOW());
    SELECT COALESCE(SUM(amount), 0) INTO v_total_savings FROM "transactions" WHERE "memberId" = v_member_id AND "type" = 'MONTHLY_SAVINGS' AND "status" = 'Completed';
    SELECT * INTO v_settings FROM "settings" LIMIT 1;

    v_max_loanable_amount := FLOOR(v_total_savings * v_settings."loanToSavingsRatioNumerator" / v_settings."loanToSavingsRatioDenominator");

    IF v_active_loan IS NULL THEN
        SELECT EXISTS(SELECT 1 FROM "loans" WHERE "memberId" = v_member_id AND "applicationStatus" = 'Pending') INTO v_pending_application;
        RETURN QUERY SELECT FALSE, 0, 0, 0, 'N/A', v_pending_application, v_loans_this_year, v_max_loanable_amount, v_total_savings;
    ELSE
        RETURN QUERY SELECT
            TRUE,
            v_active_loan.amount,
            v_active_loan."repaidAmount",
            v_active_loan."repaymentPeriod",
            to_char(v_active_loan."approvalDate" + interval '1 month', 'YYYY-MM-DD'),
            FALSE,
            v_loans_this_year,
            v_max_loanable_amount,
            v_total_savings;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the function to get organization loan data
CREATE OR REPLACE FUNCTION get_organization_loan_data()
RETURNS TABLE (
    "organizationTotalFund" NUMERIC,
    "organizationOtherFunds" NUMERIC,
    "activeLoans" JSON,
    "totalLoanedOut" NUMERIC
) AS $$
DECLARE
    v_total_savings NUMERIC;
    v_total_other_payments NUMERIC;
    v_total_loan_disbursed NUMERIC;
    v_active_loans_json JSON;
    v_total_loaned_out NUMERIC;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_total_savings FROM "transactions" WHERE "type" = 'MONTHLY_SAVINGS' AND "status" = 'Completed';
    SELECT COALESCE(SUM(amount), 0) INTO v_total_other_payments FROM "transactions" WHERE "type" = 'OTHER' AND "status" = 'Completed';
    SELECT COALESCE(ABS(SUM(amount)), 0) INTO v_total_loan_disbursed FROM "transactions" WHERE "type" = 'LOAN_DISBURSEMENT' AND "status" = 'Completed';

    SELECT COALESCE(json_agg(row_to_json(al)), '[]') INTO v_active_loans_json FROM (
        SELECT l.id, l.amount, m."fullNameEn"
        FROM "loans" l
        JOIN "members" m ON l."memberId" = m.id
        WHERE l."loanStatus" = 'Active'
    ) al;

    SELECT COALESCE(SUM(amount), 0) INTO v_total_loaned_out FROM "loans" WHERE "loanStatus" = 'Active';

    RETURN QUERY SELECT
        v_total_savings - v_total_loan_disbursed,
        v_total_other_payments,
        v_active_loans_json,
        v_total_loaned_out;
END;
$$ LANGUAGE plpgsql;


-- Create or replace the function to get monthly payment status
CREATE OR REPLACE FUNCTION get_monthly_payment_status()
RETURNS TABLE (
    paid JSON,
    unpaid JSON
) AS $$
DECLARE
    v_month_string TEXT;
BEGIN
    v_month_string := TO_CHAR(NOW(), 'YYYY-MM');

    RETURN QUERY
    WITH approved_members AS (
        SELECT id, "fullNameEn", email, "mobilePrimary", "photoUrl" FROM "members" WHERE "status" = 'Approved'
    ),
    paid_members AS (
        SELECT DISTINCT "memberId"
        FROM "transactions"
        WHERE "type" = 'MONTHLY_SAVINGS' AND "status" = 'Completed' AND "paymentForMonth" = v_month_string
    )
    SELECT
        (SELECT COALESCE(json_agg(am), '[]') FROM approved_members am JOIN paid_members pm ON am.id = pm."memberId"),
        (SELECT COALESCE(json_agg(am), '[]') FROM approved_members am LEFT JOIN paid_members pm ON am.id = pm."memberId" WHERE pm."memberId" IS NULL);
END;
$$ LANGUAGE plpgsql;


-- Create or replace the function for handling member approval
CREATE OR REPLACE FUNCTION handle_new_member_approval(p_member_id UUID)
RETURNS void AS $$
DECLARE
    v_settings RECORD;
    v_member RECORD;
    v_month_start DATE;
    v_month_key TEXT;
    v_total_shares INT;
    v_due_amount NUMERIC;
BEGIN
    SELECT * INTO v_settings FROM "settings" LIMIT 1;
    SELECT * INTO v_member FROM "members" WHERE id = p_member_id;

    IF v_member."joiningType" = 'Old' THEN
        v_month_start := '2025-08-01';
    ELSE
        v_month_start := date_trunc('month', v_member."joiningDate");
    END IF;

    IF v_month_start <= date_trunc('month', NOW()) THEN
        v_month_key := to_char(v_month_start, 'YYYY-MM');
        
        SELECT COUNT(*) INTO v_total_shares FROM "shares" WHERE "memberId" = p_member_id AND "status" = 'Active';

        v_due_amount := v_settings."minMonthlySavings" + (v_total_shares * v_settings."shareValue");

        -- Check if a due transaction for this month already exists
        IF NOT EXISTS (SELECT 1 FROM "transactions" WHERE "memberId" = p_member_id AND "type" = 'MONTHLY_SAVINGS' AND "paymentForMonth" = v_month_key) THEN
            -- This is a simplified representation. The main calculation happens in the backend logic.
            -- This function could insert a 'DUE' record if the transaction model supported it.
            -- For now, this function ensures the member is set up, but the dues are calculated dynamically by the application logic.
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the function to transfer a share
CREATE OR REPLACE FUNCTION transfer_share_to_new_member(p_share_id UUID, p_from_member_id UUID, p_to_member_id UUID, p_admin_id TEXT)
RETURNS void AS $$
DECLARE
    v_share_value NUMERIC;
    v_past_payments NUMERIC;
BEGIN
    SELECT "shareValue" INTO v_share_value FROM "settings" LIMIT 1;
    
    SELECT COALESCE(SUM(v_share_value), 0) INTO v_past_payments
    FROM "transactions" t
    JOIN generate_series(
        (SELECT date_trunc('month', "createdAt") FROM "shares" WHERE id = p_share_id),
        date_trunc('month', NOW() - interval '1 month'),
        '1 month'
    ) AS s(m) ON to_char(t.date, 'YYYY-MM') = to_char(s.m, 'YYYY-MM')
    WHERE t."memberId" = p_from_member_id AND t.type = 'MONTHLY_SAVINGS' AND t.status = 'Completed';

    IF v_past_payments > 0 THEN
        INSERT INTO "transactions" ("memberId", amount, type, status, "paymentMethod", "transactionId", "approvedBy", reason)
        VALUES (p_from_member_id, v_past_payments, 'OTHER', 'Completed', 'Manual', 'TRNSFR-ADV-' || p_share_id::text, p_admin_id, 'Share transfer advance credit');
    END IF;

    UPDATE "shares" SET "memberId" = p_to_member_id, status = 'Active' WHERE id = p_share_id;
    
    INSERT INTO "share_transfers" ("shareId", "fromMemberId", "toMemberId", "approvedBy")
    VALUES (p_share_id, p_from_member_id, p_to_member_id, p_admin_id);
END;
$$ LANGUAGE plpgsql;


-- Create or replace the function to delete a member and user
CREATE OR REPLACE FUNCTION delete_member_and_user(p_member_id UUID, p_clerk_id TEXT)
RETURNS void AS $$
DECLARE
BEGIN
    -- This function will only delete database records.
    -- The Clerk user must be deleted via the Clerk API from the backend server.
    DELETE FROM "transactions" WHERE "memberId" = p_member_id;
    DELETE FROM "loans" WHERE "memberId" = p_member_id;
    DELETE FROM "messages" WHERE "memberId" = p_member_id;
    DELETE FROM "shares" WHERE "memberId" = p_member_id;
    DELETE FROM "profile_updates" WHERE "memberId" = p_member_id;
    DELETE FROM "event_payments" WHERE "memberId" = p_member_id;
    DELETE FROM "members" WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the function to import data
CREATE OR REPLACE FUNCTION import_full_data(p_data JSON)
RETURNS void AS $$
DECLARE
    table_name TEXT;
    records JSON;
BEGIN
    -- The order of deletion and insertion is crucial to respect foreign key constraints.
    -- Deletion order (reverse of insertion)
    DELETE FROM "share_transfers";
    DELETE FROM "profile_updates";
    DELETE FROM "transactions";
    DELETE FROM "guarantors";
    DELETE FROM "loans";
    DELETE FROM "shares";
    DELETE FROM "posts";
    DELETE FROM "event_payments";
    DELETE FROM "events";
    DELETE FROM "payment_accounts";
    DELETE FROM "messages";
    DELETE FROM "members";
    DELETE FROM "settings";

    -- Insertion order
    INSERT INTO "settings" SELECT * FROM json_populate_recordset(null::settings, p_data->'settings');
    INSERT INTO "members" SELECT * FROM json_populate_recordset(null::members, p_data->'members');
    INSERT INTO "messages" SELECT * FROM json_populate_recordset(null::messages, p_data->'messages');
    INSERT INTO "payment_accounts" SELECT * FROM json_populate_recordset(null::payment_accounts, p_data->'payment_accounts');
    INSERT INTO "events" SELECT * FROM json_populate_recordset(null::events, p_data->'events');
    INSERT INTO "event_payments" SELECT * FROM json_populate_recordset(null::event_payments, p_data->'event_payments');
    INSERT INTO "posts" SELECT * FROM json_populate_recordset(null::posts, p_data->'posts');
    INSERT INTO "shares" SELECT * FROM json_populate_recordset(null::shares, p_data->'shares');
    INSERT INTO "loans" SELECT * FROM json_populate_recordset(null::loans, p_data->'loans');
    INSERT INTO "guarantors" SELECT * FROM json_populate_recordset(null::guarantors, p_data->'guarantors');
    INSERT INTO "transactions" SELECT * FROM json_populate_recordset(null::transactions, p_data->'transactions');
    INSERT INTO "profile_updates" SELECT * FROM json_populate_recordset(null::profile_updates, p_data->'profile_updates');
    INSERT INTO "share_transfers" SELECT * FROM json_populate_recordset(null::share_transfers, p_data->'share_transfers');

END;
$$ LANGUAGE plpgsql;
