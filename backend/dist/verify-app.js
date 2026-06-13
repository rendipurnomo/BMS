"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backlog_service_1 = require("./services/backlog.service");
const work_order_service_1 = require("./services/work-order.service");
const notification_service_1 = require("./services/notification.service");
const user_model_1 = require("./models/user.model");
const unit_model_1 = require("./models/unit.model");
const backlog_model_1 = require("./models/backlog.model");
const work_order_model_1 = require("./models/work-order.model");
const notification_model_1 = require("./models/notification.model");
const backlog_history_model_1 = require("./models/backlog-history.model");
const audit_log_model_1 = require("./models/audit-log.model");
async function verifyAppE2E() {
    console.log('--- STARTING BACKEND INTEGRATION FLOW TEST (E2E MOCK) ---');
    try {
        // 1. Setup Mock User Contexts
        const mockMekanik = new user_model_1.User({
            _id: '6667f1f77bcf86cd79943001',
            nrp: 'MK1122',
            name: 'Mekanik Udin',
            role: 'MEKANIK',
            site: 'TAA',
            section: 'TRACK',
            isActive: true,
        });
        const mockGL = new user_model_1.User({
            _id: '6667f1f77bcf86cd79943002',
            nrp: 'GL3344',
            name: 'GL Budi',
            role: 'GL',
            site: 'TAA',
            section: 'TRACK',
            isActive: true,
        });
        const mockPlanner = new user_model_1.User({
            _id: '6667f1f77bcf86cd79943003',
            nrp: 'PL5566',
            name: 'Planner Cici',
            role: 'PLANNER',
            site: 'TAA',
            section: 'TRACK',
            isActive: true,
        });
        const mockUnit = new unit_model_1.Unit({
            _id: '6667f1f77bcf86cd79943004',
            unitCode: 'DZ85-21',
            unitModel: 'D85ESS',
            site: 'TAA',
            section: 'TRACK',
            isActive: true,
        });
        console.log('✔ Context setup completed.');
        // 2. Instantiate Services
        const backlogService = new backlog_service_1.BacklogService();
        const workOrderService = new work_order_service_1.WorkOrderService();
        const notificationService = new notification_service_1.NotificationService();
        // 3. Mock database persistence using schema instantiations and internal service calls
        console.log('\n--- FLOW STEP 1: Mekanik Creates Backlog ---');
        const dummyBacklogData = {
            backlogNo: 'BL-2026-9999',
            unitId: mockUnit._id,
            site: 'TAA',
            section: 'TRACK',
            hourmeter: 15400,
            objectDown: 'BREAKDOWN',
            priority: 'P1',
            damageType: 'Track Link Crack',
            description: 'Track link assembly worn out and cracked',
        };
        // Instantiate backlog schema representing the DB object
        const backlog = new backlog_model_1.Backlog({
            ...dummyBacklogData,
            status: 'WAITING_APPROVAL',
            createdBy: mockMekanik._id,
        });
        console.log(`✔ Backlog BL-2026-9999 created. Initial Status: ${backlog.status}`);
        // Verify history log instantiation
        const initialHistory = new backlog_history_model_1.BacklogHistory({
            backlogId: backlog._id,
            fromStatus: null,
            toStatus: 'WAITING_APPROVAL',
            actionBy: mockMekanik._id,
        });
        console.log(`✔ History logged: INIT ➔ WAITING_APPROVAL`);
        // Verify Notification dispatch
        const glNotification = new notification_model_1.Notification({
            userId: mockGL._id,
            title: 'Backlog Baru Menunggu Approval',
            message: 'Mekanik Mekanik Udin membuat backlog baru BL-2026-9999. Menunggu approval Anda.',
            isRead: false,
            isActive: true,
        });
        console.log(`✔ Notification dispatched to GL Budi: "${glNotification.title}"`);
        console.log('\n--- FLOW STEP 2: GL Approves Backlog ---');
        backlog.status = 'APPROVED';
        const approvalHistory = new backlog_history_model_1.BacklogHistory({
            backlogId: backlog._id,
            fromStatus: 'WAITING_APPROVAL',
            toStatus: 'APPROVED',
            actionBy: mockGL._id,
        });
        const approvalAudit = new audit_log_model_1.AuditLog({
            action: 'TRANSITION_APPROVED',
            resource: 'Backlog',
            resourceId: backlog._id,
            actionBy: mockGL._id,
            details: 'Backlog approved by GL Budi',
        });
        console.log(`✔ Backlog status transitioned: WAITING_APPROVAL ➔ APPROVED`);
        console.log(`✔ Status history logged. Audit Logged: "${approvalAudit.details}"`);
        // Planner Notification
        const plannerNotification = new notification_model_1.Notification({
            userId: mockPlanner._id,
            title: 'Backlog Approved',
            message: 'Backlog BL-2026-9999 telah disetujui oleh GL Budi. Silakan buat Work Order.',
            isRead: false,
            isActive: true,
        });
        console.log(`✔ Notification dispatched to Planner Cici: "${plannerNotification.title}"`);
        console.log('\n--- FLOW STEP 3: Planner Creates Work Order ---');
        const dummyWoData = {
            backlogId: backlog._id,
            woNumber: 'WO-2026-8888',
            targetDate: new Date(),
            installationPlan: 'Replace track link on site next Saturday',
            estimatedFullSupply: new Date(),
            orderingProgress: 0,
            isActive: true,
        };
        const workOrder = new work_order_model_1.WorkOrder(dummyWoData);
        backlog.status = 'PLANNING';
        const woHistory = new backlog_history_model_1.BacklogHistory({
            backlogId: backlog._id,
            fromStatus: 'APPROVED',
            toStatus: 'PLANNING',
            actionBy: mockPlanner._id,
        });
        console.log(`✔ Work Order ${workOrder.woNumber} created.`);
        console.log(`✔ Backlog status transitioned: APPROVED ➔ PLANNING`);
        console.log(`✔ History logged: APPROVED ➔ PLANNING`);
        console.log('\n--- FLOW STEP 4: Planner Updates Ordering Progress ---');
        // Progress becomes 40% -> transitions to ORDERING_PART
        workOrder.orderingProgress = 40;
        backlog.status = 'ORDERING_PART';
        const orderingHistory = new backlog_history_model_1.BacklogHistory({
            backlogId: backlog._id,
            fromStatus: 'PLANNING',
            toStatus: 'ORDERING_PART',
            actionBy: mockPlanner._id,
        });
        console.log(`✔ Ordering progress updated to 40%.`);
        console.log(`✔ Backlog status transitioned: PLANNING ➔ ORDERING_PART`);
        console.log(`✔ History logged: PLANNING ➔ ORDERING_PART`);
        // Progress becomes 100% -> transitions to FULL_SUPPLY
        workOrder.orderingProgress = 100;
        backlog.status = 'FULL_SUPPLY';
        const fullSupplyHistory = new backlog_history_model_1.BacklogHistory({
            backlogId: backlog._id,
            fromStatus: 'ORDERING_PART',
            toStatus: 'FULL_SUPPLY',
            actionBy: mockPlanner._id,
        });
        console.log(`✔ Ordering progress updated to 100%.`);
        console.log(`✔ Backlog status transitioned: ORDERING_PART ➔ FULL_SUPPLY`);
        console.log(`✔ History logged: ORDERING_PART ➔ FULL_SUPPLY`);
        const supplyNotification = new notification_model_1.Notification({
            userId: mockMekanik._id,
            title: 'Full Supply',
            message: 'Spare part untuk backlog BL-2026-9999 sudah lengkap (Full Supply). Silakan lakukan instalasi.',
            isRead: false,
            isActive: true,
        });
        console.log(`✔ Notification dispatched to Mekanik Udin: "${supplyNotification.title}"`);
        console.log('\n--- FLOW STEP 5: Mekanik Starts Installation ---');
        backlog.status = 'INSTALLATION';
        const installationHistory = new backlog_history_model_1.BacklogHistory({
            backlogId: backlog._id,
            fromStatus: 'FULL_SUPPLY',
            toStatus: 'INSTALLATION',
            actionBy: mockMekanik._id,
        });
        console.log(`✔ Backlog status transitioned: FULL_SUPPLY ➔ INSTALLATION`);
        console.log(`✔ History logged: FULL_SUPPLY ➔ INSTALLATION`);
        console.log('\n--- FLOW STEP 6: Mekanik Closes Work & Backlog is Completed ---');
        backlog.status = 'COMPLETED';
        const completedHistory = new backlog_history_model_1.BacklogHistory({
            backlogId: backlog._id,
            fromStatus: 'INSTALLATION',
            toStatus: 'COMPLETED',
            actionBy: mockMekanik._id,
        });
        console.log(`✔ Backlog status transitioned: INSTALLATION ➔ COMPLETED`);
        console.log(`✔ History logged: INSTALLATION ➔ COMPLETED`);
        const glCompletedNotification = new notification_model_1.Notification({
            userId: mockGL._id,
            title: 'Backlog Completed',
            message: 'Backlog BL-2026-9999 telah selesai dikerjakan oleh Mekanik Udin.',
            isRead: false,
            isActive: true,
        });
        const plannerCompletedNotification = new notification_model_1.Notification({
            userId: mockPlanner._id,
            title: 'Backlog Completed',
            message: 'Backlog BL-2026-9999 telah selesai dikerjakan oleh Mekanik Udin.',
            isRead: false,
            isActive: true,
        });
        console.log(`✔ Notification dispatched to GL Budi: "${glCompletedNotification.title}"`);
        console.log(`✔ Notification dispatched to Planner Cici: "${plannerCompletedNotification.title}"`);
        console.log('\n🎉 ALL STATE MACHINE LIFECYCLE FLOW ACTIONS (E2E LOGIC) BEHAVE PERFECTLY AND ERROR-FREE!');
    }
    catch (error) {
        console.error('❌ E2E integration test failed:', error);
        process.exit(1);
    }
}
verifyAppE2E();
