import {
  LoginRequestSchema,
  CreateUserSchema,
  CreateBacklogSchema,
  UpdateOrderingProgressSchema,
  CompleteBacklogSchema,
} from './dtos';

function testSchema(schemaName: string, schema: any, payload: any, expectedValid: boolean) {
  const result = schema.safeParse(payload);
  if (result.success === expectedValid) {
    console.log(`✔ Schema [${schemaName}] test: ${expectedValid ? 'VALID' : 'INVALID'} payload behaved correctly.`);
  } else {
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
  testSchema(
    'LoginRequest (Valid)',
    LoginRequestSchema,
    { nrp: '12345678', password: 'secretpassword' },
    true
  );
  testSchema(
    'LoginRequest (Invalid - Empty NRP)',
    LoginRequestSchema,
    { nrp: '', password: 'secretpassword' },
    false
  );

  // 2. Test Create User Schema
  testSchema(
    'CreateUser (Valid)',
    CreateUserSchema,
    {
      nrp: 'NRP9988',
      name: 'Michael',
      password: 'mypassword',
      role: 'ADMIN',
      site: 'TAA',
      section: 'TRACK',
    },
    true
  );
  testSchema(
    'CreateUser (Invalid - Bad Enum Role & Section)',
    CreateUserSchema,
    {
      nrp: 'NRP9988',
      name: 'Michael',
      password: 'mypw', // too short (min 6)
      role: 'SUPERADMIN', // invalid role
      site: 'TAA',
      section: 'CABIN', // invalid section
    },
    false
  );

  // 3. Test Create Backlog Schema
  testSchema(
    'CreateBacklog (Valid)',
    CreateBacklogSchema,
    {
      backlogNo: 'BL-2026-1002',
      unitId: '507f1f77bcf86cd799439011',
      site: 'TAA',
      section: 'WHEEL',
      hourmeter: 850,
      objectDown: 'BREAKDOWN',
      priority: 'P1',
      damageType: 'Hose Leaking',
      description: 'Hydraulic hose cracked and leaking oil',
    },
    true
  );
  testSchema(
    'CreateBacklog (Invalid - Bad ObjectID & Negative Hourmeter)',
    CreateBacklogSchema,
    {
      backlogNo: 'BL-2026-1002',
      unitId: 'invalid-id-string',
      site: 'TAA',
      section: 'WHEEL',
      hourmeter: -10, // negative hourmeter
      objectDown: 'BREAKDOWN',
      priority: 'P1',
      damageType: 'Hose Leaking',
      description: 'Hydraulic hose cracked and leaking oil',
    },
    false
  );

  // 4. Test Update Ordering Progress Schema
  testSchema(
    'UpdateOrderingProgress (Valid)',
    UpdateOrderingProgressSchema,
    { orderingProgress: 45 },
    true
  );
  testSchema(
    'UpdateOrderingProgress (Invalid - Out of bounds)',
    UpdateOrderingProgressSchema,
    { orderingProgress: 105 },
    false
  );

  // 5. Test Complete Backlog Schema
  testSchema(
    'CompleteBacklog (Valid)',
    CompleteBacklogSchema,
    {
      completionHourmeter: 1250,
      manpower: 'Alex, Dave',
      remarks: 'Replaced Hose',
    },
    true
  );
  testSchema(
    'CompleteBacklog (Invalid - Missing fields)',
    CompleteBacklogSchema,
    {
      completionHourmeter: 1250,
      // missing remarks & manpower
    },
    false
  );

  console.log('\n🎉 ALL DTO VALIDATION SCHEMAS AND TYPES BEHAVE EXACTLY AS SPECIFIED!');
}

runVerification();
