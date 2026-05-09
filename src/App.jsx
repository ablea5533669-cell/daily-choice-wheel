import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eeisudauymxacbdyvted.supabase.co";
const SUPABASE_KEY = "sb_publishable_4Ora_X7NkjphHwupVuQGQQ_iS5DJtI0";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const DEFAULT_WHEELS = [
  {
    id: "food",
    title: "今天吃什么",
    emoji: "🍚",
    description: "中午别纠结了，让转盘替你们拍板。",
    cta: "开饭局裁决",
    options: [
      { label: "炒菜", emoji: "🥘" },
      { label: "牛关关", emoji: "🐮" },
      { label: "花溪牛肉粉", emoji: "🍜" },
      { label: "西北凉皮", emoji: "🥗" },
      { label: "余肥肠", emoji: "🍲" },
      { label: "东北水饺", emoji: "🥟" },
    ],
  },
  {
    id: "drink",
    title: "今天喝什么",
    emoji: "🧋",
    description: "奶茶、汽水、咖啡因，命运会给答案。",
    cta: "开饮品裁决",
    options: [
      { label: "茉莉奶白", emoji: "🌼" },
      { label: "可乐", emoji: "🥤" },
      { label: "一点点", emoji: "🧋" },
      { label: "喜茶", emoji: "🍵" },
      { label: "霸王茶姬", emoji: "👑" },
    ],
  },
];

const COLORS = ["#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff", "#ffadad", "#d8f3dc", "#f1c0e8", "#cfbaf0", "#a3c4f3"];
const RANDOM_EMOJIS = ["🍽️", "🍜", "🥘", "🥟", "🍱", "🧋", "🥤", "☕", "🍵", "🍰", "🍔", "🍟"];
const TOASTS = ["别争了，交给命运。", "今天就听转盘的，别反悔。", "选择困难症退散。", "不满意？可以再转，但要付出一点尊严。", "随机不是敷衍，是一种优雅的决策方式。"];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const normDeg = (deg) => ((deg % 360) + 360) % 360;
const makeCode = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const getJoinCodeFromUrl = () => {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const pathCode = ["join", "g"].includes(parts[0]) ? parts[1] : "";
  return (pathCode || new URLSearchParams(window.location.search).get("join") || "").toUpperCase();
};

function hitIndexByRotation(rotationDeg, count) {
  const slice = 360 / count;
  const angleAtPointer = (360 - normDeg(rotationDeg)) % 360;
  return Math.floor((angleAtPointer + 0.0001) / slice) % count;
}

function OptionIcon({ option, className = "h-5 w-5 text-base" }) {
  if (option?.logo_url) return <img src={option.logo_url} alt={option.label} className={`${className} rounded-full object-contain`} onError={(e) => (e.currentTarget.style.display = "none")} />;
  return <span className={`inline-flex items-center justify-center leading-none ${className}`}>{option?.emoji || "🍽️"}</span>;
}

function WheelCanvas({ options, rotation, isSpinning }) {
  const count = Math.max(options.length, 1);
  const slice = 360 / count;
  const displayRotation = normDeg(rotation);
  const radius = count <= 5 ? 126 : count <= 7 ? 138 : 150;
  const width = count <= 6 ? 118 : 106;
  const gradient = options.map((_, i) => `${COLORS[i % COLORS.length]} ${i * slice}deg ${(i + 1) * slice}deg`).join(", ");

  return (
    <div className="relative mx-auto flex h-[320px] w-[320px] items-center justify-center sm:h-[420px] sm:w-[420px]">
      <div className="absolute -top-1 z-30 h-0 w-0 border-l-[16px] border-r-[16px] border-t-[32px] border-l-transparent border-r-transparent border-t-slate-950 drop-shadow-lg" />
      <div className="relative h-full w-full rounded-full border-[12px] border-white shadow-2xl transition-transform ease-out" style={{ background: `conic-gradient(${gradient})`, transform: `rotate(${rotation}deg)`, transitionDuration: isSpinning ? "4200ms" : "500ms" }}>
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.96)_0_18%,rgba(255,255,255,0)_19%)]" />
        {options.map((option, index) => {
          const angle = index * slice + slice / 2;
          return (
            <div key={option.id} className="absolute left-1/2 top-1/2 z-10" style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px)` }}>
              <div className="flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-3 py-2 shadow-md ring-1 ring-white/80 backdrop-blur-md transition-transform ease-out" style={{ width, transform: `rotate(${-angle - displayRotation}deg)`, transitionDuration: isSpinning ? "4200ms" : "500ms" }}>
                <OptionIcon option={option} className="h-5 w-5 shrink-0 text-base" />
                <span className="min-w-0 truncate text-xs font-black text-slate-900 sm:text-[13px]">{option.label}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute z-40 flex h-20 w-20 items-center justify-center rounded-full border-8 border-white bg-slate-950 text-sm font-black text-white shadow-xl sm:h-24 sm:w-24">开转</div>
    </div>
  );
}

async function seedDefaultWheels(owner) {
  for (const item of DEFAULT_WHEELS) {
    const wheelPayload = {
      title: item.title,
      emoji: item.emoji,
      description: item.description,
      cta: item.cta,
      custom: false,
      owner_type: owner.type,
      owner_user_id: owner.type === "personal" ? owner.userId : null,
      group_id: owner.type === "group" ? owner.groupId : null,
    };
    const { data: wheel, error: wheelError } = await supabase.from("wheels").insert(wheelPayload).select("*").single();
    if (wheelError) throw wheelError;
    const optionRows = item.options.map((option, index) => ({ wheel_id: wheel.id, label: option.label, emoji: option.emoji, logo_url: "", sort_order: index }));
    const { error: optionError } = await supabase.from("wheel_options").insert(optionRows);
    if (optionError) throw optionError;
  }
}

export default function DailyChoiceWheelApp() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [nameDraft, setNameDraft] = useState("");
  const [groups, setGroups] = useState([]);
  const [space, setSpace] = useState({ type: "personal", groupId: null });
  const [wheels, setWheels] = useState([]);
  const [activeWheelId, setActiveWheelId] = useState(null);
  const [histories, setHistories] = useState({});
  const [newOption, setNewOption] = useState("");
  const [newWheelTitle, setNewWheelTitle] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState(getJoinCodeFromUrl());
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState("正在连接云端数据…");
  const [loading, setLoading] = useState(true);
  const [undoStack, setUndoStack] = useState([]);
  const timerRef = useRef(null);

  const activeGroup = useMemo(() => groups.find((g) => g.id === space.groupId) || null, [groups, space.groupId]);
  const activeWheel = useMemo(() => wheels.find((w) => w.id === activeWheelId) || null, [wheels, activeWheelId]);
  const spaceTitle = space.type === "group" && activeGroup ? activeGroup.name : "我的私人空间";
  const spaceBadge = space.type === "group" && activeGroup ? `群组 ${activeGroup.code}` : "仅自己可见";
  const scopeKey = space.type === "group" && activeGroup ? `group:${activeGroup.id}` : `user:${user?.id}`;

  useEffect(() => {
    init();
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (user) loadSpace(space);
  }, [space.type, space.groupId, user?.id]);

  async function init() {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      let currentUser = data.session?.user;
      if (!currentUser) {
        const { data: anonData, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        currentUser = anonData.user;
      }
      setUser(currentUser);
      await ensureProfile(currentUser.id);
      await loadGroups(currentUser.id);
      await ensurePersonalDefaults(currentUser.id);
      const code = getJoinCodeFromUrl();
      if (code) await joinGroupByCode(code, currentUser.id, true);
      else await loadSpace({ type: "personal", groupId: null }, currentUser.id);
      setToast("已连接云端。私人数据和群组数据现在会同步保存。");
    } catch (error) {
      console.error(error);
      setToast(`连接失败：${error.message || "请检查 Supabase 匿名登录、RLS 和表结构"}`);
    } finally {
      setLoading(false);
    }
  }

  async function ensureProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) {
      setProfile(data);
      setNameDraft(data.nickname);
      return data;
    }
    const nickname = `匿名饭友 ${String(userId).slice(0, 4)}`;
    const { data: inserted, error } = await supabase.from("profiles").insert({ id: userId, nickname }).select("*").single();
    if (error) throw error;
    setProfile(inserted);
    setNameDraft(inserted.nickname);
    return inserted;
  }

  async function ensurePersonalDefaults(userId) {
    const { data, error } = await supabase.from("wheels").select("id").eq("owner_type", "personal").eq("owner_user_id", userId).limit(1);
    if (error) throw error;
    if (!data?.length) await seedDefaultWheels({ type: "personal", userId });
  }

  async function loadGroups(userId = user?.id) {
    if (!userId) return [];
    const { data: memberships, error } = await supabase.from("group_members").select("choice_groups(*)").eq("user_id", userId);
    if (error) throw error;
    const list = (memberships || []).map((m) => m.choice_groups).filter(Boolean);
    setGroups(list);
    return list;
  }

  async function loadSpace(target = space, userId = user?.id) {
    if (!userId) return;
    let query = supabase.from("wheels").select("*").order("created_at", { ascending: true });
    if (target.type === "group") query = query.eq("owner_type", "group").eq("group_id", target.groupId);
    else query = query.eq("owner_type", "personal").eq("owner_user_id", userId);
    const { data: wheelRows, error } = await query;
    if (error) throw error;
    const ids = (wheelRows || []).map((w) => w.id);
    const optionsByWheel = {};
    const historyByWheel = {};
    if (ids.length) {
      const { data: optionRows, error: optionError } = await supabase.from("wheel_options").select("*").in("wheel_id", ids).order("sort_order", { ascending: true });
      if (optionError) throw optionError;
      (optionRows || []).forEach((o) => (optionsByWheel[o.wheel_id] ||= []).push(o));
      const { data: historyRows } = await supabase.from("spin_history").select("*").in("wheel_id", ids).order("created_at", { ascending: false }).limit(60);
      (historyRows || []).forEach((h) => (historyByWheel[h.wheel_id] ||= []).push(h));
    }
    const merged = (wheelRows || []).map((w) => ({ ...w, options: optionsByWheel[w.id] || [] }));
    setWheels(merged);
    setHistories(historyByWheel);
    if (activeWheelId && !merged.some((w) => w.id === activeWheelId)) setActiveWheelId(null);
  }

  async function saveName() {
    const nickname = nameDraft.trim();
    if (!nickname) return setNameDraft(profile?.nickname || "匿名饭友"), setToast("名字不能为空。匿名也要有个体面称呼，嗯？");
    const { data, error } = await supabase.from("profiles").update({ nickname, updated_at: new Date().toISOString() }).eq("id", user.id).select("*").single();
    if (error) return setToast(`保存失败：${error.message}`);
    setProfile(data);
    setToast(`已改名为：${nickname}`);
  }

  async function createGroup() {
    const name = newGroupName.trim() || "午饭纠结小组";
    const { data: group, error } = await supabase.from("choice_groups").insert({ code: makeCode(), name, owner_user_id: user.id }).select("*").single();
    if (error) return setToast(`创建失败：${error.message}`);
    const { error: memberError } = await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id });
    if (memberError) return setToast(`加入群组失败：${memberError.message}`);
    await seedDefaultWheels({ type: "group", groupId: group.id });
    setNewGroupName("");
    await loadGroups(user.id);
    setSpace({ type: "group", groupId: group.id });
    setToast(`群组已创建：${group.name}。邀请码是 ${group.code}。`);
  }

  async function joinGroupByCode(code, userId = user?.id, fromUrl = false) {
    const safeCode = String(code || "").trim().toUpperCase();
    if (!safeCode) return setToast("先输入群组邀请码。别让我猜，嗯？");
    const { data: group, error } = await supabase.from("choice_groups").select("*").eq("code", safeCode).maybeSingle();
    if (error) return setToast(`查询失败：${error.message}`);
    if (!group) return setToast("没找到这个群组。检查一下邀请码。");
    const { error: joinError } = await supabase.from("group_members").upsert({ group_id: group.id, user_id: userId }, { onConflict: "group_id,user_id" });
    if (joinError) return setToast(`加入失败：${joinError.message}`);
    setJoinCode("");
    await loadGroups(userId);
    setSpace({ type: "group", groupId: group.id });
    if (fromUrl) window.history.replaceState(null, "", "/");
    setToast(`已加入群组：${group.name}。`);
  }

  async function createWheel() {
    const title = newWheelTitle.trim();
    if (!title) return setToast("先给新转盘起个名字，比如：今天吃什么甜品。很简单。");
    const payload = { title, emoji: pick(["🎯", "🍜", "🥤", "🍰", "☕", "🍱", "🍟", "🥗"]), description: space.type === "group" ? "群组共享转盘，成员都能一起添加和查看。" : "私人自定义转盘，只有当前匿名账号可见。", cta: "开始随机", custom: true, owner_type: space.type, owner_user_id: space.type === "personal" ? user.id : null, group_id: space.type === "group" ? space.groupId : null };
    const { data: wheel, error } = await supabase.from("wheels").insert(payload).select("*").single();
    if (error) return setToast(`创建失败：${error.message}`);
    await supabase.from("wheel_options").insert([
      { wheel_id: wheel.id, label: "选项 A", emoji: "🍽️", sort_order: 0 },
      { wheel_id: wheel.id, label: "选项 B", emoji: "🥤", sort_order: 1 },
    ]);
    setNewWheelTitle("");
    setActiveWheelId(wheel.id);
    await loadSpace();
  }

  async function deleteWheel(wheel) {
    if (!wheel.custom) return setToast("默认转盘不建议删。你要是不想要，恢复默认就够了。");
    const { error } = await supabase.from("wheels").delete().eq("id", wheel.id);
    if (error) return setToast(`删除失败：${error.message}`);
    if (activeWheelId === wheel.id) setActiveWheelId(null);
    await loadSpace();
    setToast(`已删除转盘：${wheel.title}`);
  }

  async function addOption() {
    if (!activeWheel) return;
    const label = newOption.trim();
    if (!label) return setToast("先写个选项。空选项可不许混进来。");
    if (activeWheel.options.some((o) => o.label.trim().toLowerCase() === label.toLowerCase())) return setToast(`“${label}”已经在这个转盘里了。`);
    const maxSort = Math.max(-1, ...activeWheel.options.map((o) => o.sort_order || 0));
    const payload = { wheel_id: activeWheel.id, label, emoji: pick(RANDOM_EMOJIS), logo_url: "", sort_order: maxSort + 1 };
    const { data, error } = await supabase.from("wheel_options").insert(payload).select("*").single();
    if (error) return setToast(`添加失败：${error.message}`);
    setUndoStack((old) => [{ type: "add", scopeKey, wheelId: activeWheel.id, value: data }, ...old].slice(0, 30));
    setNewOption("");
    await loadSpace();
    setToast(`已加入：${data.label}。`);
  }

  async function deleteOption(option, index) {
    if (!activeWheel) return;
    if (activeWheel.options.length <= 2) return setToast("至少留两个选项，不然这就不是转盘，是通知书。懂？");
    const { error } = await supabase.from("wheel_options").delete().eq("id", option.id);
    if (error) return setToast(`删除失败：${error.message}`);
    setUndoStack((old) => [{ type: "delete", scopeKey, wheelId: activeWheel.id, value: option, index }, ...old].slice(0, 30));
    await loadSpace();
    setToast(`已删除：${option.label}。后悔的话，点撤回。`);
  }

  async function undo() {
    const last = undoStack.find((x) => x.scopeKey === scopeKey && (!activeWheel || x.wheelId === activeWheel.id));
    if (!last) return setToast("当前空间没有可撤回的操作。你已经很克制了。");
    if (last.type === "add") await supabase.from("wheel_options").delete().eq("id", last.value.id);
    if (last.type === "delete") await supabase.from("wheel_options").insert({ ...last.value, id: undefined });
    setUndoStack((old) => old.filter((x) => x !== last));
    await loadSpace();
    setToast(last.type === "add" ? `已撤回新增：${last.value.label}` : `已恢复：${last.value.label}`);
  }

  async function restoreWheel() {
    if (!activeWheel) return;
    const defaults = DEFAULT_WHEELS.find((w) => w.title === activeWheel.title)?.options || [{ label: "选项 A", emoji: "🍽️" }, { label: "选项 B", emoji: "🥤" }];
    await supabase.from("wheel_options").delete().eq("wheel_id", activeWheel.id);
    await supabase.from("wheel_options").insert(defaults.map((o, i) => ({ wheel_id: activeWheel.id, label: o.label, emoji: o.emoji, sort_order: i })));
    setResult(null);
    await loadSpace();
    setToast("已恢复默认。世界短暂地恢复了秩序。");
  }

  async function restoreSpace() {
    await supabase.from("wheels").delete().in("id", wheels.map((w) => w.id));
    await seedDefaultWheels(space.type === "group" ? { type: "group", groupId: space.groupId } : { type: "personal", userId: user.id });
    setActiveWheelId(null);
    setResult(null);
    await loadSpace();
    setToast(`${spaceTitle} 已恢复默认。干净，舒服。`);
  }

  async function spin() {
    if (!activeWheel || isSpinning) return;
    const count = activeWheel.options.length;
    if (count < 2) return setToast("至少两个选项才值得转。不然命运都懒得营业。");
    const slice = 360 / count;
    const targetIndex = Math.floor(Math.random() * count);
    const targetCenter = targetIndex * slice + slice / 2;
    const targetRotation = (360 - targetCenter + 360) % 360;
    let delta = targetRotation - normDeg(rotation);
    if (delta < 0) delta += 360;
    const nextRotation = rotation + (6 + Math.floor(Math.random() * 3)) * 360 + delta;
    setIsSpinning(true);
    setResult(null);
    setToast(pick(TOASTS));
    setRotation(nextRotation);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const landed = activeWheel.options[hitIndexByRotation(nextRotation, count)];
      setIsSpinning(false);
      setResult(landed);
      await supabase.from("spin_history").insert({ wheel_id: activeWheel.id, option_id: landed.id, user_id: user.id, result_label: landed.label, result_emoji: landed.emoji || "🍽️" });
      await loadSpace();
      setToast(`结果是：${landed.label}。愿赌服输，今天就它。`);
    }, 4300);
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-orange-50 p-6 text-slate-800"><div className="rounded-3xl bg-white p-8 text-center shadow-xl"><p className="text-3xl">🎡</p><p className="mt-3 font-black">正在打开转盘…</p><p className="mt-2 text-sm text-slate-500">第一次会自动创建匿名身份。</p></div></main>;

  if (activeWheel) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-sky-50 px-4 py-6 text-slate-950 sm:px-8">
        <section className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button onClick={() => { setActiveWheelId(null); setResult(null); }} className="mb-3 text-sm font-bold text-slate-500 hover:text-slate-950">← 返回空间与转盘</button>
              <div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{spaceTitle}</span><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-400">{spaceBadge}</span></div>
              <h1 className="flex items-center gap-3 text-3xl font-black sm:text-5xl"><span>{activeWheel.emoji}</span>{activeWheel.title}</h1>
              <p className="mt-2 text-sm leading-7 text-slate-600">{activeWheel.description}</p>
            </div>
            <div className="flex flex-wrap gap-2"><button onClick={undo} className="rounded-2xl border bg-white px-4 py-3 text-sm font-bold shadow-sm">撤回上一步</button><button onClick={restoreWheel} className="rounded-2xl border bg-white px-4 py-3 text-sm font-bold shadow-sm">恢复该转盘默认</button></div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <section className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-xl sm:p-8">
              <WheelCanvas options={activeWheel.options} rotation={rotation} isSpinning={isSpinning} />
              <div className="mt-8 text-center"><button onClick={spin} disabled={isSpinning} className="rounded-full bg-slate-950 px-10 py-4 text-lg font-black text-white shadow-xl disabled:opacity-60">{isSpinning ? "命运正在加载…" : "转一下，今天就它"}</button><p className="mt-4 text-sm text-slate-500">{toast}</p></div>
              {result && <div className="mx-auto mt-6 max-w-xl rounded-[2rem] bg-slate-950 p-6 text-center text-white shadow-2xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">Final Pick</p><div className="mt-3 flex items-center justify-center gap-3"><OptionIcon option={result} className="h-10 w-10 text-4xl" /><p className="text-4xl font-black">{result.label}</p></div><p className="mt-3 text-sm text-white/70">不许赖账。除非你们集体决定再转一次，哼。</p></div>}
            </section>
            <aside className="space-y-5">
              <section className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-xl"><h2 className="text-xl font-black">添加新选项</h2><p className="mt-2 text-sm leading-7 text-slate-500">{space.type === "group" ? "添加后会进入群组共享池，成员都能看到。" : "添加后自动保存到你的私人空间，其他匿名用户不可见。"}</p><div className="mt-4 flex gap-2"><input value={newOption} onChange={(e) => setNewOption(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addOption()} placeholder="比如：麻辣烫 / 瑞幸 / 烤肉饭" className="min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none" /><button onClick={addOption} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">添加</button></div></section>
              <section className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-black">当前选项</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{activeWheel.options.length} 个</span></div><div className="mt-4 max-h-[330px] space-y-2 overflow-auto pr-1">{activeWheel.options.map((option, index) => <div key={option.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm"><div className="flex min-w-0 items-center gap-3"><OptionIcon option={option} className="h-7 w-7 shrink-0 text-xl" /><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{option.label}</p><p className="text-xs text-slate-400">#{String(index + 1).padStart(2, "0")}</p></div></div><button onClick={() => deleteOption(option, index)} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-400 hover:bg-red-50 hover:text-red-500">删除</button></div>)}</div></section>
              <section className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-xl"><h2 className="text-xl font-black">最近结果</h2>{histories[activeWheel.id]?.length ? <div className="mt-4 flex flex-wrap gap-2">{histories[activeWheel.id].map((item) => <span key={item.id} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700"><span>{item.result_emoji}</span>{item.result_label}</span>)}</div> : <p className="mt-3 text-sm leading-7 text-slate-500">还没转过。第一口命运，通常最香。</p>}</section>
            </aside>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-sky-50 px-4 py-8 text-slate-950 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-xl sm:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="mb-3 inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">Daily Choice Wheel</p><h1 className="text-4xl font-black tracking-tight sm:text-6xl">今天到底选什么？</h1><p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">无需注册。打开网页自动生成匿名身份；私人空间只自己可见，群组空间通过邀请码共享。</p></div><div className="rounded-3xl border bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Current User</p><div className="mt-2 flex gap-2"><input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} onBlur={saveName} onKeyDown={(e) => e.key === "Enter" && saveName()} className="min-w-0 rounded-2xl border px-3 py-2 text-sm font-black outline-none" placeholder="输入你的名字" /><button onClick={saveName} className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">保存</button></div><p className="mt-2 max-w-[300px] truncate text-xs text-slate-400">{user?.id}</p></div></div></div>
        <div className="mb-6 grid gap-4 lg:grid-cols-3"><section className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-lg"><p className="text-4xl">🔒</p><h2 className="mt-3 text-2xl font-black">我的私人空间</h2><p className="mt-2 text-sm leading-7 text-slate-500">这里的新增选项，只属于当前匿名用户。</p><button onClick={() => setSpace({ type: "personal", groupId: null })} className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">进入私人转盘</button></section><section className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-lg"><p className="text-4xl">👥</p><h2 className="mt-3 text-2xl font-black">创建群组</h2><p className="mt-2 text-sm leading-7 text-slate-500">生成邀请码。加入后的成员共享群组转盘。</p><div className="mt-4 flex gap-2"><input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createGroup()} placeholder="比如：午饭小队" className="min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none" /><button onClick={createGroup} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">创建</button></div></section><section className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-lg"><p className="text-4xl">🔑</p><h2 className="mt-3 text-2xl font-black">加入群组</h2><p className="mt-2 text-sm leading-7 text-slate-500">输入同事发来的邀请码，加入共享转盘。</p><div className="mt-4 flex gap-2"><input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && joinGroupByCode(joinCode)} placeholder="6 位邀请码" className="min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm uppercase tracking-[0.15em] outline-none" /><button onClick={() => joinGroupByCode(joinCode)} className="rounded-2xl bg-white px-5 py-3 text-sm font-black shadow-sm">加入</button></div></section></div>
        {groups.length > 0 && <section className="mb-6 rounded-[2rem] border border-white bg-white/80 p-5 shadow-lg"><h2 className="mb-4 text-xl font-black">我的群组</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{groups.map((group) => <button key={group.id} onClick={() => setSpace({ type: "group", groupId: group.id })} className="rounded-3xl border bg-white p-4 text-left shadow-sm"><div className="flex items-start justify-between"><div><p className="text-lg font-black">{group.name}</p><p className="mt-1 text-xs font-bold text-slate-400">邀请码：{group.code}</p><p className="mt-1 text-xs text-slate-400">分享：/join/{group.code}</p></div></div></button>)}</div></section>}
        <div className="mb-6 rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-lg"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{spaceBadge}</p><h2 className="text-3xl font-black">{spaceTitle}</h2><p className="mt-2 text-sm leading-7 text-slate-500">{space.type === "group" ? "你在群组空间里，新增和删除只影响当前群组。" : "你在私人空间里，新增和删除只影响你自己的转盘。"}</p></div><button onClick={restoreSpace} className="rounded-2xl border bg-white px-5 py-3 text-sm font-bold shadow-sm">恢复当前空间默认</button></div></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{wheels.map((wheel) => <article key={wheel.id} className="rounded-[2rem] border border-white bg-white/85 p-6 shadow-lg"><div className="mb-5 flex items-start justify-between"><div className="text-5xl">{wheel.emoji}</div><div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{wheel.options.length} 个选项</div></div><h2 className="text-2xl font-black">{wheel.title}</h2><p className="mt-3 min-h-[52px] text-sm leading-7 text-slate-600">{wheel.description}</p><div className="mt-5 flex flex-wrap gap-2">{wheel.options.slice(0, 5).map((o) => <span key={o.id} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"><OptionIcon option={o} className="h-4 w-4 text-xs" />{o.label}</span>)}{wheel.options.length > 5 && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">+{wheel.options.length - 5}</span>}</div><div className="mt-6 flex gap-3"><button onClick={() => { setActiveWheelId(wheel.id); setResult(null); setToast(wheel.description); }} className="flex-1 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">{wheel.cta}</button>{wheel.custom && <button onClick={() => deleteWheel(wheel)} className="rounded-2xl border bg-white px-4 py-3 text-sm font-bold text-slate-500">删除</button>}</div></article>)}<article className="rounded-[2rem] border border-dashed border-slate-300 bg-white/55 p-6 shadow-inner"><div className="text-5xl">➕</div><h2 className="mt-5 text-2xl font-black">新增一个转盘</h2><p className="mt-3 text-sm leading-7 text-slate-600">{space.type === "group" ? "新增后只出现在当前群组。" : "新增后只属于当前匿名账号。"}</p><div className="mt-5 flex gap-2"><input value={newWheelTitle} onChange={(e) => setNewWheelTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createWheel()} placeholder="输入转盘名称" className="min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none" /><button onClick={createWheel} className="rounded-2xl bg-white px-5 py-3 text-sm font-black shadow-sm">新建</button></div></article></div>
        <p className="mx-auto mt-8 max-w-3xl rounded-2xl bg-white/70 px-5 py-4 text-center text-sm leading-7 text-slate-500 shadow-sm">{toast}</p>
      </section>
    </main>
  );
}
