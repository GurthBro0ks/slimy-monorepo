# Slimy Monorepo Dependency Graph

```mermaid
graph TD
    subgraph "Apps"
        web("@slimy/web<br/>Next.js 16.0.1")
        admin-api("@slimy/admin-api<br/>Express API")
        admin-ui("@slimy/admin-ui<br/>Next.js 14.2.5")
        bot("@slimy/bot<br/>Discord Bot")
    end

    subgraph "Packages"
        shared-auth("@slimy/shared-auth")
        shared-codes("@slimy/shared-codes")
        shared-config("@slimy/shared-config")
        shared-db("@slimy/shared-db")
        shared-snail("@slimy/shared-snail")
    end

    subgraph "Key External Dependencies"
        react19("React 19.2.0")
        react18("React 18.2.0")
        next16("Next.js 16.0.1")
        next14("Next.js 14.2.5")
        prisma("Prisma 6.19.0")
        typescript("TypeScript 5.x")
        zod3("Zod 3.25.6")
        zod4("Zod 4.1.12")
        sharp33("Sharp 0.33.x")
        redis("Redis 4.6.8")
    end

    web --> react19
    web --> next16
    web --> prisma
    web --> zod4
    web --> sharp33
    web --> redis

    admin-api --> prisma
    admin-api --> zod3
    admin-api --> sharp33
    admin-api --> redis

    admin-ui --> react18
    admin-ui --> next14

    bot --> typescript

    style web fill:#e1f5ff
    style admin-api fill:#fff4e1
    style admin-ui fill:#e8f5e9
    style bot fill:#f3e5f5
    style react19 fill:#ff9999
    style react18 fill:#ff9999
    style next16 fill:#ffcc99
    style next14 fill:#ffcc99
    style zod3 fill:#ffff99
    style zod4 fill:#ffff99
```

## Key Findings

### Version Inconsistencies

1. **React Versions:**
   - `@slimy/web`: React 19.2.0
   - `@slimy/admin-ui`: React 18.2.0

2. **Next.js Versions:**
   - `@slimy/web`: Next.js 16.0.1
   - `@slimy/admin-ui`: Next.js 14.2.5

3. **Zod Versions:**
   - `@slimy/web`: Zod 4.1.12
   - `@slimy/admin-api`: Zod 3.25.6

4. **Sharp Versions:**
   - `@slimy/web`: Sharp 0.33.5
   - `@slimy/admin-api`: Sharp 0.33.4

5. **TypeScript Versions:**
   - `@slimy/web`: TypeScript 5.x (devDep)
   - `@slimy/bot`: TypeScript 5.3.3 (devDep)

### Package Status

All five shared packages (`shared-auth`, `shared-codes`, `shared-config`, `shared-db`, `shared-snail`) appear to be **placeholder packages** with no dependencies or exports defined. They contain only TODO build and test scripts.
