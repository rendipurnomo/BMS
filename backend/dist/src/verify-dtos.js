"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dtos_1 = require("./dtos");
function testSchema(schemaName, schema, payload, expectedValid) {
    const result = schema.safeParse(payload);
    if (result.success === expectedValid) {
        console.log(`✔ Schema [${schemaName}] test: ${expectedValid ? 'VALID' : 'INVALID'} payload behaved correctly.`);
    }
    else {
        console.error(`❌ Schema [${schemaName}] test FAILED. Expected success to be ${expectedValid}, got ${result.success}`);
        if (!result.success) {
            console.error('Errors:', result.error.format());
        }
        process.exit(1);
    }
}
function runVerification() {
    console.log('--- STARTING DTO VALIDATION VERIFICATION ---');
    // 1. Test Login Schema
    testSchema('LoginRequest (Valid)', dtos_1.LoginRequestSchema, { nrp: '12345678', password: 'secretpassword' }, true);
    testSchema('LoginRequest (Invalid - Empty NRP)', dtos_1.LoginRequestSchema, { nrp: '', password: 'secretpassword' }, false);
    // 2. Test Create User Schema
    testSchema('CreateUser (Valid)', dtos_1.CreateUserSchema, {
        nrp: 'NRP9988',
        name: 'Michael',
        password: 'mypassword',
        role: 'ADMIN',
        site: 'TAA',
        section: 'TRACK',
    }, true);
    testSchema('CreateUser (Invalid - Bad Enum Role & Section)', dtos_1.CreateUserSchema, {
        nrp: 'NRP9988',
        name: 'Michael',
        password: 'mypw', // too short (min 6)
        role: 'SUPERADMIN', // invalid role
        site: 'TAA',
        section: 'CABIN', // invalid section
    }, false);
    // 3. Test Create Backlog Schema
    testSchema('CreateBacklog (Valid)', dtos_1.CreateBacklogSchema, {
        backlogNo: 'BL-2026-1002',
        unitId: '507f1f77bcf86cd799439011',
        site: 'TAA',
        section: 'WHEEL',
        hourmeter: 850,
        objectDown: 'BREAKDOWN',
        priority: 'P1',
        damageType: 'Hose Leaking',
        description: 'Hydraulic hose cracked and leaking oil',
    }, true);
    testSchema('CreateBacklog (Invalid - Bad ObjectID & Negative Hourmeter)', dtos_1.CreateBacklogSchema, {
        backlogNo: 'BL-2026-1002',
        unitId: 'invalid-id-string',
        site: 'TAA',
        section: 'WHEEL',
        hourmeter: -10, // negative hourmeter
        objectDown: 'BREAKDOWN',
        priority: 'P1',
        damageType: 'Hose Leaking',
        description: 'Hydraulic hose cracked and leaking oil',
    }, false);
    // 4. Test Update Ordering Progress Schema
    testSchema('UpdateOrderingProgress (Valid)', dtos_1.UpdateOrderingProgressSchema, { orderingProgress: 45 }, true);
    testSchema('UpdateOrderingProgress (Invalid - Out of bounds)', dtos_1.UpdateOrderingProgressSchema, { orderingProgress: 105 }, false);
    // 5. Test Complete Backlog Schema
    testSchema('CompleteBacklog (Valid)', dtos_1.CompleteBacklogSchema, {
        completionHourmeter: 1250,
        manpower: 'Alex, Dave',
        remarks: 'Replaced Hose',
    }, true);
    testSchema('CompleteBacklog (Invalid - Missing fields)', dtos_1.CompleteBacklogSchema, {
        completionHourmeter: 1250,
        // missing remarks & manpower
    }, false);
    console.log('\n🎉 ALL DTO VALIDATION SCHEMAS AND TYPES BEHAVE EXACTLY AS SPECIFIED!');
}
runVerification();
