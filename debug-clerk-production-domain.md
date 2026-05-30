[OPEN] Clerk production domain debug

## Session
- id: clerk-production-domain
- started_at: 2026-05-30
- symptom: 首页内嵌 Clerk waitlist 在 production key 下请求 `https://clerk.what2post.pages.dev/v1/*` 返回 404 / CORS，组件仍显示 development mode，waitlist 提交失败

## Hypotheses
1. Clerk production frontend API 域名被配置成 `clerk.what2post.pages.dev`，但该域名未正确接入 Clerk，导致 `/v1/environment` 与 `/v1/client` 404。
2. `pages.dev` 免费域名无法满足 Clerk production 自定义域名前端 API 映射要求，因此 production 实例无法在当前域名下正常工作。
3. 当前 `pk_live_...` 对应的 Clerk production 实例还未完成域名/应用配置，前端脚本拿到的是未就绪配置。
4. 首页代码与 Dashboard 配置不一致，导致 production key 请求错误的 frontend API 域名。

## Evidence
- User log: `GET https://clerk.what2post.pages.dev/v1/environment ... 404`
- User log: `GET https://clerk.what2post.pages.dev/v1/client ... 404`
- User log: `Access to fetch ... blocked by CORS policy: No 'Access-Control-Allow-Origin' header`
- User log: `Network error at "https://clerk.what2post.pages.dev/v1/waitlist..."`
- Code check: `index.html` uses `pk_live_...` on the homepage.
- Docs evidence: Clerk production deployment requires a domain you own and the ability to add DNS records.
- Docs evidence: Clerk Frontend API production setup normally uses DNS/CNAME, or an advanced proxy setup on your own domain.

## Status
- Initial classification complete
- No business logic changes in this session yet
- H1 confirmed: frontend API domain `clerk.what2post.pages.dev` is not serving Clerk API routes.
- H2 highly likely: `pages.dev` free domain is not suitable for Clerk production DNS/CNAME setup because you do not control DNS for that host.
- H3 possible but secondary: production instance may still need full domain setup in Dashboard.
- H4 not supported by current evidence: this is not primarily a homepage logic issue.
