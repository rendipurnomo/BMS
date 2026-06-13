import { AuthService } from './services/auth.service';
import { authorize, BMSPermission } from './middlewares/rbac.middleware';

async function verifyAuth() {
  console.log('--- STARTING AUTH MODULE & RBAC VERIFICATION ---');

  const authService = new AuthService();

  try {
    // 1. Verify Password Hashing
    const password = 'SuperSecretPassword2026';
    const hash = await authService.hashPassword(password);
    console.log('✔ Password hashed successfully:', hash);

    const isMatch = await authService.comparePassword(password, hash);
    const isFalseMatch = await authService.comparePassword('WrongPassword', hash);

    if (isMatch && !isFalseMatch) {
      console.log('✔ Password comparison behaves correctly (matches hash & blocks incorrect strings).');
    } else {
      throw new Error('Password comparison logic failed.');
    }

    // 2. Verify JWT Token Lifecycle
    const mockUser: any = {
      _id: '507f1f77bcf86cd799439011',
      nrp: '12345678',
      name: 'John Doe',
      role: 'MEKANIK',
      site: 'TAA',
      section: 'TRACK',
    };

    const accessToken = authService.generateAccessToken(mockUser);
    const refreshToken = authService.generateRefreshToken(mockUser);

    console.log('✔ Access Token generated:', accessToken.substring(0, 30) + '...');
    console.log('✔ Refresh Token generated:', refreshToken.substring(0, 30) + '...');

    const decodedAccess = authService.verifyAccessToken(accessToken);
    const decodedRefresh = authService.verifyRefreshToken(refreshToken);

    if (decodedAccess.nrp === mockUser.nrp && decodedAccess.role === mockUser.role && decodedRefresh.sub === mockUser._id) {
      console.log('✔ Tokens verified and verified attributes match payload correctly.');
    } else {
      throw new Error('Token verification decoded incorrect payload data.');
    }

    // 3. Verify RBAC Matrix (Based on RBAC.md)
    console.log('\n--- VERIFYING RBAC MATRIX ---');
    const rbacTests: { role: string; permission: BMSPermission; expected: boolean }[] = [
      // user:create (Admin only)
      { role: 'ADMIN', permission: 'user:create', expected: true },
      { role: 'PLANNER', permission: 'user:create', expected: false },
      { role: 'GL', permission: 'user:create', expected: false },
      { role: 'MEKANIK', permission: 'user:create', expected: false },
      // backlog:create (Mekanik only)
      { role: 'ADMIN', permission: 'backlog:create', expected: false },
      { role: 'PLANNER', permission: 'backlog:create', expected: false },
      { role: 'GL', permission: 'backlog:create', expected: false },
      { role: 'MEKANIK', permission: 'backlog:create', expected: true },
      // backlog:view (All roles)
      { role: 'ADMIN', permission: 'backlog:view', expected: true },
      { role: 'PLANNER', permission: 'backlog:view', expected: true },
      { role: 'GL', permission: 'backlog:view', expected: true },
      { role: 'MEKANIK', permission: 'backlog:view', expected: true },
      // backlog:approve (GL only)
      { role: 'ADMIN', permission: 'backlog:approve', expected: false },
      { role: 'PLANNER', permission: 'backlog:approve', expected: false },
      { role: 'GL', permission: 'backlog:approve', expected: true },
      { role: 'MEKANIK', permission: 'backlog:approve', expected: false },
      // wo:create (Planner only)
      { role: 'ADMIN', permission: 'wo:create', expected: false },
      { role: 'PLANNER', permission: 'wo:create', expected: true },
      { role: 'GL', permission: 'wo:create', expected: false },
      { role: 'MEKANIK', permission: 'wo:create', expected: false },
      // installation:update (Mekanik only)
      { role: 'ADMIN', permission: 'installation:update', expected: false },
      { role: 'PLANNER', permission: 'installation:update', expected: false },
      { role: 'GL', permission: 'installation:update', expected: false },
      { role: 'MEKANIK', permission: 'installation:update', expected: true },
    ];

    let passedAllRbac = true;
    for (const test of rbacTests) {
      // Mock Express Request, Response, Next
      const req = { user: { role: test.role } };
      let allowed = false;
      const res = {
        status: (code: number) => {
          return {
            json: (body: any) => {
              allowed = false;
            },
          };
        },
      };
      const next = () => {
        allowed = true;
      };

      const middleware = authorize(test.permission);
      middleware(req as any, res as any, next);

      if (allowed === test.expected) {
        console.log(`✔ [RBAC] Role: ${test.role.padEnd(8)} | Permission: ${test.permission.padEnd(20)} | Expected: ${test.expected ? 'ALLOW' : 'DENY'} | Match: OK`);
      } else {
        console.error(`❌ [RBAC] Role: ${test.role.padEnd(8)} | Permission: ${test.permission.padEnd(20)} | Expected: ${test.expected ? 'ALLOW' : 'DENY'} | Match: FAILED`);
        passedAllRbac = false;
      }
    }

    if (!passedAllRbac) {
      throw new Error('RBAC matrix verification failed.');
    }

    console.log('\n🎉 ALL AUTHENTICATION AND RBAC SERVICES ARE VERIFIED SUCCESSFUL!');
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
    process.exit(1);
  }
}

verifyAuth();
