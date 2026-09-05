// 多谱 - 后端 API 客户端
// 开发时 NEXT_PUBLIC_API_BASE 指向 http://127.0.0.1:8000
// 生产时走 Nginx 反代同源 /api，NEXT_PUBLIC_API_BASE 留空
// API 路径带谱前缀：/api/{clanId}/auth/...、/api/{clanId}/changes/...

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

// 当前激活谱（由页面在挂载时设置）；token 也按谱隔离
let activeClan = "chen";
export function setActiveClan(clanId: string) {
  activeClan = clanId;
}
export function getActiveClan(): string {
  return activeClan;
}

function tokenKey(clanId = activeClan) {
  return `${clanId}_genealogy_token`;
}
function userKey(clanId = activeClan) {
  return `${clanId}_genealogy_user`;
}

export interface UserInfo {
  id: number;
  phone: string;
  name: string;
  role: "user" | "admin";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(tokenKey());
}

export function getUser(): UserInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(userKey());
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: UserInfo) {
  localStorage.setItem(tokenKey(), token);
  localStorage.setItem(userKey(), JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(tokenKey());
  localStorage.removeItem(userKey());
}

export function isAdmin(): boolean {
  return getUser()?.role === "admin";
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let detail = `请求失败 (${res.status})`;
    try {
      const data = await res.json();
      if (data.detail) detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

/** 构造带谱前缀的 API 路径 */
function api(clanId: string, sub: string) {
  return `/api/${clanId}${sub}`;
}

// ==============================
// 认证 API
// ==============================

export function sendCode(clanId: string, phone: string, purpose: "register" | "login") {
  return request<{ message: string; simulated: boolean; dev_code: string | null }>(
    api(clanId, "/auth/send-code"),
    { method: "POST", body: { phone, purpose } }
  );
}

export function register(clanId: string, phone: string, code: string, name: string, password: string, fatherName = "", motherName = "") {
  return request<{ token: string; user: UserInfo }>(api(clanId, "/auth/register"), {
    method: "POST",
    body: { phone, code, name, password, fatherName, motherName },
  });
}

export function login(clanId: string, phone: string, password: string) {
  return request<{ token: string; user: UserInfo }>(api(clanId, "/auth/login"), {
    method: "POST",
    body: { phone, password },
  });
}

export function codeLogin(clanId: string, phone: string, code: string) {
  return request<{ token: string; user: UserInfo }>(api(clanId, "/auth/code-login"), {
    method: "POST",
    body: { phone, code },
  });
}

export function adminLogin(clanId: string, password: string) {
  return request<{ token: string; user: UserInfo }>(api(clanId, "/auth/admin-login"), {
    method: "POST",
    body: { password },
  });
}

export async function fetchMe(clanId: string): Promise<UserInfo | null> {
  try {
    return await request<UserInfo>(api(clanId, "/auth/me"));
  } catch {
    return null;
  }
}

// ==============================
// 变化记录 API
// ==============================

export interface ChangeRecord {
  id: number;
  type: "birth" | "marriage" | "death";
  data: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  submitter_name: string;
  submitter_phone: string;
  remark: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function submitBirth(clanId: string, data: Record<string, unknown>) {
  return request<{ message: string }>(api(clanId, "/changes/birth"), { method: "POST", body: data });
}

export function submitMarriage(clanId: string, data: Record<string, unknown>) {
  return request<{ message: string }>(api(clanId, "/changes/marriage"), { method: "POST", body: data });
}

export function submitDeath(clanId: string, data: Record<string, unknown>) {
  return request<{ message: string }>(api(clanId, "/changes/death"), { method: "POST", body: data });
}

export function fetchMyChanges(clanId: string): Promise<ChangeRecord[]> {
  return request<ChangeRecord[]>(api(clanId, "/changes/mine"));
}

export function fetchPending(clanId: string, status = "pending"): Promise<ChangeRecord[]> {
  return request<ChangeRecord[]>(api(clanId, `/admin/pending?status=${status}`));
}

export function reviewChange(clanId: string, id: number, decision: "approve" | "reject") {
  return request<{ message: string }>(api(clanId, `/admin/review/${id}`), {
    method: "POST",
    body: { decision },
  });
}

// ==============================
// 整理人员变动 API（管理员）
// ==============================

export interface ExportRecord {
  id: number;
  type: "birth" | "marriage" | "death";
  data: Record<string, unknown>;
  submitter_name: string;
}

/** 未整理（审核通过且未导出）变动清单 */
export function fetchExportPending(clanId: string): Promise<ChangeRecord[]> {
  return request<ChangeRecord[]>(api(clanId, "/admin/export/pending"));
}

/** 把未整理的已通过变动渲染为世系表风格文本 */
export function generateExport(clanId: string): Promise<{ count: number; text: string }> {
  return request<{ count: number; text: string }>(api(clanId, "/admin/export/generate"), {
    method: "POST",
  });
}

/** 标记本次整理过的变动为已导出（避免下次重复） */
export function markExported(clanId: string, changeIds: number[]): Promise<{ message: string; updated: number }> {
  return request<{ message: string; updated: number }>(api(clanId, "/admin/export/mark"), {
    method: "POST",
    body: { change_ids: changeIds },
  });
}

// ==============================
// 反馈 API
// ==============================

export interface FeedbackRecord {
  id: number;
  content: string;
  submitter_name: string;
  submitter_phone: string;
  status: "pending" | "replied";
  reply: string | null;
  replied_by: string | null;
  replied_at: string | null;
  created_at: string;
}

export function submitFeedback(clanId: string, content: string) {
  return request<{ message: string }>(api(clanId, "/feedback"), {
    method: "POST",
    body: { content },
  });
}

export function fetchMyFeedbacks(clanId: string): Promise<FeedbackRecord[]> {
  return request<FeedbackRecord[]>(api(clanId, "/feedback/mine"));
}

export function fetchFeedbacks(clanId: string, status = "pending"): Promise<FeedbackRecord[]> {
  return request<FeedbackRecord[]>(api(clanId, `/feedback/list?status=${status}`));
}

export function replyFeedback(clanId: string, id: number, reply: string) {
  return request<{ message: string }>(api(clanId, `/feedback/reply/${id}`), {
    method: "POST",
    body: { reply },
  });
}

// ==============================
// 用户管理 API（管理员）
// ==============================

export interface UserRecord {
  id: number;
  phone: string;
  name: string;
  role: "user" | "admin";
  clan: string;
  created_at: string;
}

export function fetchUsers(clanId: string): Promise<UserRecord[]> {
  return request<UserRecord[]>(api(clanId, "/admin/users"));
}

export function updateUserRole(clanId: string, userId: number, role: "user" | "admin") {
  return request<{ message: string }>(api(clanId, `/admin/users/${userId}/role`), {
    method: "POST",
    body: { role },
  });
}

export function deleteUser(clanId: string, userId: number) {
  return request<{ message: string }>(api(clanId, `/admin/users/${userId}`), {
    method: "DELETE",
  });
}

// ==============================
// 照片 API（C 方案：全托管后端）
// ==============================

export interface PersonPhotos {
  self: string | null;
  spouse: string | null;
}

/** 拉取全谱照片映射 {人物规范名: {self, spouse}}（URL 为相对路径 /uploads/...） */
export function fetchPhotos(clanId: string): Promise<Record<string, PersonPhotos>> {
  return request<Record<string, PersonPhotos>>(api(clanId, "/photos"));
}

/** 照片相对路径 → 完整可访问 URL（开发拼 API_BASE，生产同源） */
export function resolvePhotoUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith("/") ? `${API_BASE}${url}` : url;
}

export interface UploadResult {
  message: string;
  photos: { slot: string; url: string }[];
}

/** 上传/更换照片（multipart，self/spouse 可选其一或都传），需登录且为自己或 admin */
export function uploadPhoto(
  clanId: string,
  personName: string,
  files: { self?: File; spouse?: File }
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("person_name", personName);
    if (files.self) fd.append("self_file", files.self);
    if (files.spouse) fd.append("spouse_file", files.spouse);
    const token = getToken();
    fetch(`${API_BASE}/api/${clanId}/photos`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    })
      .then(async (res) => {
        let data: UploadResult | { detail?: string } = {};
        try {
          data = await res.json();
        } catch {
          // ignore
        }
        if (!res.ok) {
          throw new Error((data as { detail?: string }).detail || `上传失败 (${res.status})`);
        }
        resolve(data as UploadResult);
      })
      .catch(reject);
  });
}

/** 删除某槽位照片（管理员） */
export function deletePhoto(clanId: string, personName: string, slot: "self" | "spouse") {
  return request<{ message: string }>(
    `${api(clanId, "/photos")}?person_name=${encodeURIComponent(personName)}&slot=${slot}`,
    { method: "DELETE" }
  );
}

// ==============================
// 多多进宝（拼多多 CPS 导购）
// ==============================
export interface DdkGood {
  id: string;
  title: string;
  image: string;
  couponPrice: number | null;
  originPrice: number | null;
  promoUrl: string;
  tag: string;
  mallName: string;
  salesTip: string;
}

export interface DdkGoodsResp {
  items: DdkGood[];
  total: number;
  configured: boolean;
  error?: string;
  message?: string;
}

/** 拉取多多进宝商品（后端转链，公开接口） */
export function fetchDdkGoods(keyword = "", page = 1, pageSize = 20): Promise<DdkGoodsResp> {
  const q = new URLSearchParams({
    keyword,
    page: String(page),
    page_size: String(pageSize),
  });
  return request<DdkGoodsResp>(`/api/ddk/goods?${q.toString()}`);
}

// ==============================
// 广告总开关配置
// ==============================
export interface AdConfig {
  enabled: boolean;
  provider: "pdd" | "baidu" | "off";
  baidu_code?: string;
  scenes: Record<string, string>;
}

/** 读取广告总开关与场景关键词（公开） */
export function fetchAdConfig(): Promise<AdConfig> {
  return request<AdConfig>("/api/ads/config");
}

/** 管理员修改广告总开关 / 广告源 / 场景关键词（需 admin token，request 自动携带） */
export function updateAdConfig(payload: {
  enabled?: boolean;
  provider?: "pdd" | "baidu" | "off";
  baidu_code?: string;
  scenes?: Record<string, string>;
}): Promise<AdConfig> {
  return request<AdConfig>("/api/ads/config", { method: "POST", body: payload });
}