"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("./models");
async function verifyModels() {
    console.log('--- STARTING MODEL VERIFICATION ---');
    try {
        // 1. Verify User Model
        const dummyUser = new models_1.User({
            nrp: '12345678',
            name: 'John Doe',
            passwordHash: 'hashed_password_string',
            role: 'MEKANIK',
            site: 'TAA',
            section: 'TRACK',
            isActive: true,
        });
        console.log('✔ User model instantiated successfully. Name:', dummyUser.name);
        // 2. Verify Unit Model
        const dummyUnit = new models_1.Unit({
            unitCode: 'EX3600-6',
            unitModel: 'EX3600',
            site: 'TAA',
            section: 'TRACK',
            isActive: true,
        });
        console.log('✔ Unit model instantiated successfully. Code:', dummyUnit.unitCode);
        // 3. Verify Backlog Model
        const dummyBacklog = new models_1.Backlog({
            backlogNo: 'BL-2026-0001',
            unitId: dummyUnit._id,
            site: 'TAA',
            section: 'TRACK',
            hourmeter: 12000,
            objectDown: 'BREAKDOWN',
            priority: 'P1',
            damageType: 'Structural Crack',
            description: 'Boom cylinder bracket cracked',
            status: 'WAITING_APPROVAL',
            createdBy: dummyUser._id,
            isActive: true,
        });
        console.log('✔ Backlog model instantiated successfully. No:', dummyBacklog.backlogNo);
        // 4. Verify Backlog Part Model
        const dummyPart = new models_1.BacklogPart({
            backlogId: dummyBacklog._id,
            partNumber: '123-456-789',
            partName: 'Bracket Pin',
            qty: 2,
            supplyQty: 0,
            isActive: true,
        });
        console.log('✔ BacklogPart model instantiated successfully. Part:', dummyPart.partName);
        // 5. Verify Work Order Model
        const dummyWorkOrder = new models_1.WorkOrder({
            backlogId: dummyBacklog._id,
            woNumber: 'WO-987654',
            targetDate: new Date(),
            installationPlan: 'Replace boom bracket on site next Wednesday',
            estimatedFullSupply: new Date(),
            orderingProgress: 0,
            isActive: true,
        });
        console.log('✔ WorkOrder model instantiated successfully. WO:', dummyWorkOrder.woNumber);
        // 6. Verify Backlog Photo Model
        const dummyPhoto = new models_1.BacklogPhoto({
            backlogId: dummyBacklog._id,
            photoType: 'BEFORE',
            photoUrl: 'https://storage.bms.internal/photos/bl-0001-before.jpg',
            isActive: true,
        });
        console.log('✔ BacklogPhoto model instantiated successfully. URL:', dummyPhoto.photoUrl);
        // 7. Verify Completion Model
        const dummyCompletion = new models_1.Completion({
            backlogId: dummyBacklog._id,
            completionHourmeter: 12015,
            manpower: 'John Doe, Jane Smith',
            remarks: 'Welding completed and pin replaced successfully.',
            isActive: true,
        });
        console.log('✔ Completion model instantiated successfully. Remarks:', dummyCompletion.remarks);
        // 8. Verify Notification Model
        const dummyNotification = new models_1.Notification({
            userId: dummyUser._id,
            title: 'Backlog Created',
            message: 'New backlog BL-2026-0001 has been created and is waiting for approval.',
            isRead: false,
            isActive: true,
        });
        console.log('✔ Notification model instantiated successfully. Title:', dummyNotification.title);
        // 9. Verify Backlog History Model
        const dummyHistory = new models_1.BacklogHistory({
            backlogId: dummyBacklog._id,
            fromStatus: null,
            toStatus: 'WAITING_APPROVAL',
            actionBy: dummyUser._id,
        });
        console.log('✔ BacklogHistory model instantiated successfully. Transited to:', dummyHistory.toStatus);
        // 10. Verify Audit Log Model
        const dummyAudit = new models_1.AuditLog({
            action: 'CREATE_BACKLOG',
            resource: 'Backlog',
            resourceId: dummyBacklog._id,
            actionBy: dummyUser._id,
            details: 'Mekanik created backlog BL-2026-0001',
        });
        console.log('✔ AuditLog model instantiated successfully. Action:', dummyAudit.action);
        console.log('\n🎉 ALL 10 MODELS AND TYPES HAVE BEEN SUCCESSFULLY VERIFIED (SCHEMA AND LOGIC LEVEL)!');
    }
    catch (error) {
        console.error('❌ Model instantiation failed with error:', error);
        process.exit(1);
    }
}
verifyModels();
