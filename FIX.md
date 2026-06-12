# Phase 1: Executive Verdict - Pivot to Laravel (TALL Stack)

Given the requirements—a highly secure, relational, dashboard-heavy medical registry hosting PII—a pivot to the TALL stack (Tailwind, Alpine, Laravel, Livewire) with **PostgreSQL** and Filament PHP is the architecturally superior choice.

**1. Database Migration (MongoDB -> PostgreSQL):** The current MongoDB implementation is fundamentally unsuited for strict relational health data. We will migrate to PostgreSQL to guarantee ACID compliance, row-level security (RLS), and strict schema enforcement.
**2. Security by Default:** Laravel provides battle-tested authentication, CSRF protection, secure session management, and robust rate limiting out-of-the-box. 
**3. Dashboard Velocity:** Filament PHP enables the rapid generation of complex, secure admin panels with granular RBAC and audit trails, drastically outperforming custom Next.js UI development in both speed and maintainability.
**4. Long-Term Stability:** Laravel's cohesive ecosystem ensures 10+ years of maintainability, which is critical for government/NGO infrastructure.

---

# Phase 2: TALL Stack Migration Roadmap

### Step 1: Database Migration to PostgreSQL
MongoDB is a NoSQL document store. We must extract the existing JSON documents and normalize them into strict relational PostgreSQL tables.

**Laravel Migration (PostgreSQL) Example:**
```php
// Create Users Table
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('password');
    $table->enum('role', ['superadmin', 'admin', 'member'])->default('member');
    $table->timestamps();
});

// Create Memberships Table
Schema::create('memberships', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // 1-to-1 relation
    $table->string('tier');
    $table->enum('status', ['pending', 'active', 'cancelled'])->default('pending');
    $table->string('payment_method');
    $table->enum('payment_status', ['pending', 'paid', 'failed'])->default('pending');
    $table->date('start_date');
    $table->date('end_date');
    $table->decimal('price', 8, 2);
    
    // PII Fields (Application-Level Encryption)
    $table->text('cin')->nullable();         // Encrypted
    $table->text('phone')->nullable();       // Encrypted
    $table->date('date_of_birth')->nullable();
    
    $table->timestamps();
});

// Create Audit Logs
Schema::create('audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained(); // Who did it
    $table->string('action'); // e.g., 'approved_membership'
    $table->string('resource'); // e.g., 'Membership'
    $table->json('details'); // Old vs New state
    $table->ipAddress('ip_address')->nullable();
    $table->timestamps();
});
```

### Step 2: Implement Application-Level Encryption (ALE)
To protect National IDs (CIN) and phone numbers, we will use Laravel's built-in Model Casting for encryption. This ensures data is encrypted before entering PostgreSQL and decrypted automatically when accessed by authorized code.

```php
// app/Models/Membership.php
class Membership extends Model
{
    protected $casts = [
        'cin' => 'encrypted',
        'phone' => 'encrypted',
        'date_of_birth' => 'date',
    ];
}
```

### Step 3: Filament PHP Admin Panel
Instead of manually building Shadcn UI tables for doctors, we will generate Filament resources. This gives us sorting, filtering, exporting, and RBAC automatically.

```bash
# Generate the dashboard UI in seconds
php artisan make:filament-resource Membership
php artisan make:filament-resource User
```

### Step 4: Strict Role-Based Access Control (RBAC)
We will use Spatie's Laravel Permission package to strictly control who can view, approve, or edit doctors' information. 

```php
// app/Policies/MembershipPolicy.php
public function update(User $user, Membership $membership): bool
{
    return $user->hasRole('superadmin') || $user->hasPermissionTo('edit_memberships');
}
```

### Step 5: Redis Rate Limiting
Laravel includes native rate limiting powered by Redis. We will configure this in `RouteServiceProvider` to protect login endpoints and API routes from brute-force attacks.

```php
// Rate limiting 5 login attempts per minute per IP
RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->ip());
});
```
