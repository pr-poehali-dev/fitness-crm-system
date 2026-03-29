import { useState } from 'react';
import { StoreType, StaffMember, StaffRole, Permission, ROLE_LABELS, DEFAULT_PERMISSIONS } from '@/store';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StaffProps {
  store: StoreType;
}

const PERMISSION_GROUPS: { label: string; icon: string; keys: (keyof Permission)[] }[] = [
  {
    label: 'Аналитика и отчёты',
    icon: 'BarChart3',
    keys: ['viewDirectorDashboard', 'viewAdminDashboard', 'viewFinanceHistory', 'editDeleteOperations', 'exportData'],
  },
  {
    label: 'Клиенты',
    icon: 'Users',
    keys: ['addClients', 'viewClientCards', 'viewPhoneNumbers'],
  },
  {
    label: 'Расписание и продажи',
    icon: 'Calendar',
    keys: ['viewSchedule', 'enrollClients', 'sellSubscriptions', 'addExpenses'],
  },
  {
    label: 'Настройки и управление',
    icon: 'Settings',
    keys: ['manageTrainings', 'manageSubscriptionPlans', 'manageStaff', 'manageSettings', 'manageSalesPlan'],
  },
];

const MENU_ITEMS: { key: keyof Permission; label: string; icon: string }[] = [
  { key: 'menuAnalytics', label: 'Аналитика', icon: 'TrendingUp' },
  { key: 'menuReports', label: 'Отчёты', icon: 'FileBarChart2' },
  { key: 'menuDashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { key: 'menuClients', label: 'Клиенты', icon: 'Users' },
  { key: 'menuSchedule', label: 'Расписание', icon: 'Calendar' },
  { key: 'menuSubscriptions', label: 'Абонементы', icon: 'CreditCard' },
  { key: 'menuSales', label: 'Продажи', icon: 'ShoppingBag' },
  { key: 'menuFinance', label: 'Финансы', icon: 'BarChart3' },
  { key: 'menuBranches', label: 'Филиалы', icon: 'Building2' },
  { key: 'menuStaff', label: 'Сотрудники', icon: 'UserCog' },
  { key: 'menuSettings', label: 'Настройки', icon: 'Settings' },
];

const PERMISSION_LABELS: Record<keyof Permission, string> = {
  viewDirectorDashboard: 'Дашборд директора/управляющего',
  viewAdminDashboard: 'Дашборд администратора',
  viewFinanceHistory: 'История финансовых операций',
  editDeleteOperations: 'Изменение и удаление операций',
  exportData: 'Выгрузка данных',
  addClients: 'Добавление клиентов',
  viewClientCards: 'Просмотр карточек клиентов',
  viewPhoneNumbers: 'Видимость телефонных номеров',
  viewSchedule: 'Просмотр расписания',
  enrollClients: 'Запись клиентов на занятия',
  sellSubscriptions: 'Продажа абонементов',
  addExpenses: 'Внесение расходов',
  manageTrainings: 'Управление тренировками',
  manageSubscriptionPlans: 'Управление абонементами',
  manageStaff: 'Управление сотрудниками',
  manageSettings: 'Настройки системы',
  manageSalesPlan: 'Установка плана продаж',
  menuAnalytics: 'Аналитика',
  menuReports: 'Отчёты',
  menuDashboard: 'Дашборд',
  menuClients: 'Клиенты',
  menuSchedule: 'Расписание',
  menuSubscriptions: 'Абонементы',
  menuSales: 'Продажи',
  menuFinance: 'Финансы',
  menuBranches: 'Филиалы',
  menuStaff: 'Сотрудники',
  menuSettings: 'Настройки',
};

const ROLE_COLORS: Record<StaffRole, string> = {
  director: 'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700',
  admin: 'bg-emerald-100 text-emerald-700',
  trainer: 'bg-amber-100 text-amber-700',
  marketer: 'bg-pink-100 text-pink-700',
};

const emptyForm = {
  name: '', role: 'admin' as StaffRole, phone: '', email: '',
  branchIds: [] as string[], password: '', login: '',
};

export default function Staff({ store }: StaffProps) {
  const { state, addStaff, updateStaff, removeStaff, generateInviteToken, regenerateAccessToken } = store;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [editPermsId, setEditPermsId] = useState<string | null>(null);
  const [permsForm, setPermsForm] = useState<Permission | null>(null);
  const [passwordModalId, setPasswordModalId] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [inviteModalId, setInviteModalId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [accessLinkCopied, setAccessLinkCopied] = useState(false);

  const getAccessLink = () => {
    const token = state.accessToken ?? regenerateAccessToken();
    return `${window.location.origin}${window.location.pathname}?access=${token}`;
  };

  const handleCopyAccessLink = () => {
    const link = getAccessLink();
    navigator.clipboard.writeText(link).then(() => {
      setAccessLinkCopied(true);
      setTimeout(() => setAccessLinkCopied(false), 2000);
    });
  };

  const handleRegenerateAccessToken = () => {
    regenerateAccessToken();
    setAccessLinkCopied(false);
  };

  const openInviteModal = (m: StaffMember) => {
    const token = m.inviteToken ?? generateInviteToken(m.id);
    const link = `${window.location.origin}${window.location.pathname}?invite=${token}`;
    setInviteLink(link);
    setInviteModalId(m.id);
    setLinkCopied(false);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const regenerateLink = (staffId: string) => {
    const token = generateInviteToken(staffId);
    const link = `${window.location.origin}${window.location.pathname}?invite=${token}`;
    setInviteLink(link);
    setLinkCopied(false);
  };

  const toggleStaffBranch = (staffId: string, branchId: string, current: string[]) => {
    const next = current.includes(branchId)
      ? current.filter(id => id !== branchId)
      : [...current, branchId];
    if (next.length > 0) updateStaff(staffId, { branchIds: next });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, branchIds: [state.currentBranchId] });
    setShowModal(true);
  };

  const openEdit = (m: StaffMember) => {
    setEditingId(m.id);
    setForm({ name: m.name, role: m.role, phone: m.phone, email: m.email, branchIds: m.branchIds, password: '', login: m.login || '' });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.role) return;
    if (editingId) {
      const upd: Partial<StaffMember> = { name: form.name, role: form.role, phone: form.phone, email: form.email, branchIds: form.branchIds, login: form.login || undefined };
      if (form.password) upd.password = form.password;
      updateStaff(editingId, upd);
    } else {
      addStaff({ name: form.name, role: form.role, phone: form.phone, email: form.email, branchIds: form.branchIds, permissions: { ...DEFAULT_PERMISSIONS[form.role] }, ...(form.password ? { password: form.password } : {}), ...(form.login ? { login: form.login } : {}) });
    }
    setShowModal(false);
  };

  const openPasswordModal = (m: StaffMember) => {
    setPasswordModalId(m.id);
    setPasswordForm({ password: '', confirm: '' });
    setShowPwd(false);
  };

  const savePassword = () => {
    if (!passwordModalId || !passwordForm.password) return;
    if (passwordForm.password !== passwordForm.confirm) return;
    updateStaff(passwordModalId, { password: passwordForm.password });
    setPasswordModalId(null);
  };

  const openPerms = (m: StaffMember) => {
    setEditPermsId(m.id);
    setPermsForm({ ...DEFAULT_PERMISSIONS[m.role], ...m.permissions });
  };

  const savePerms = () => {
    if (!editPermsId || !permsForm) return;
    updateStaff(editPermsId, { permissions: permsForm });
    setEditPermsId(null);
    setPermsForm(null);
  };

  const resetPermsToRole = (role: StaffRole) => {
    setPermsForm({ ...DEFAULT_PERMISSIONS[role] });
  };

  const toggleBranch = (branchId: string) => {
    setForm(f => ({
      ...f,
      branchIds: f.branchIds.includes(branchId) ? f.branchIds.filter(id => id !== branchId) : [...f.branchIds, branchId],
    }));
  };

  const editingMember = editPermsId ? state.staff.find(m => m.id === editPermsId) : null;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Общая ссылка для входа */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <Icon name="Link2" size={18} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm mb-0.5">Общая ссылка для сотрудников</div>
            <p className="text-xs text-muted-foreground mb-3">
              Отправьте эту ссылку сотруднику. Он откроет её и войдёт по своему логину и паролю.
            </p>
            {state.accessToken ? (
              <div className="flex gap-2 items-center">
                <div className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono truncate">
                  {`${window.location.origin}${window.location.pathname}?access=${state.accessToken}`}
                </div>
                <button
                  onClick={handleCopyAccessLink}
                  className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${accessLinkCopied ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-secondary border-border hover:bg-secondary/70'}`}
                >
                  <Icon name={accessLinkCopied ? 'Check' : 'Copy'} size={13} />
                  {accessLinkCopied ? 'Скопировано' : 'Копировать'}
                </button>
                <button
                  onClick={handleRegenerateAccessToken}
                  title="Сгенерировать новую ссылку (старая перестанет работать)"
                  className="shrink-0 p-2 rounded-lg border border-border bg-secondary hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-muted-foreground transition-colors"
                >
                  <Icon name="RefreshCw" size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { regenerateAccessToken(); }}
                className="flex items-center gap-2 text-sm px-4 py-2 bg-foreground text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Icon name="Plus" size={14} />
                Создать ссылку
              </button>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Кнопка <Icon name="RefreshCw" size={11} className="inline" /> сбросит ссылку — старая перестанет работать.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={openAdd} className="bg-foreground text-primary-foreground hover:opacity-90">
          <Icon name="UserPlus" size={14} className="mr-1.5" /> Добавить сотрудника
        </Button>
      </div>

      {/* Карточки сотрудников */}
      <div className="grid gap-3">
        {state.staff.map(m => (
          <div key={m.id} className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center shrink-0 text-sm font-semibold">
                  {m.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.login || m.email || m.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[m.role]}`}>
                  {ROLE_LABELS[m.role]}
                </span>
              </div>
            </div>

            {/* Филиалы */}
            <div className="mt-3">
              <div className="text-xs text-muted-foreground mb-1.5">Доступные филиалы:</div>
              <div className="flex flex-wrap gap-1.5">
                {state.branches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => toggleStaffBranch(m.id, b.id, m.branchIds)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      m.branchIds.includes(b.id)
                        ? 'bg-foreground text-primary-foreground border-foreground'
                        : 'border-border text-muted-foreground hover:border-foreground/40'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Действия */}
            <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
              <button onClick={() => openPasswordModal(m)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/70 border border-border transition-colors">
                <Icon name="KeyRound" size={12} />
                {m.password ? 'Пароль' : 'Задать пароль'}
              </button>
              <button onClick={() => openPerms(m)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/70 border border-border transition-colors">
                <Icon name="Shield" size={12} />
                Права
              </button>
              <button onClick={() => openEdit(m)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/70 border border-border transition-colors">
                <Icon name="Pencil" size={12} />
                Изменить
              </button>
              <button onClick={() => removeStaff(m.id)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 border border-border transition-colors ml-auto">
                <Icon name="Trash2" size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/edit staff modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Редактировать сотрудника' : 'Новый сотрудник'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">ФИО *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Роль</Label>
              <select className="w-full border border-input rounded-lg px-3 py-2 text-sm"
                value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as StaffRole }))}>
                {(Object.entries(ROLE_LABELS) as [StaffRole, string][]).map(([role, label]) => (
                  <option key={role} value={role}>{label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Телефон</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+7 (999) 000-00-00" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="mail@example.com" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Логин для входа (если отличается от email)</Label>
              <Input value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} placeholder="ivanova" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                {editingId ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={editingId ? 'Новый пароль...' : 'Пароль для входа'}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={15} />
                </button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Доступные филиалы</Label>
              <div className="flex flex-wrap gap-2">
                {state.branches.map(b => (
                  <button key={b.id} onClick={() => toggleBranch(b.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.branchIds.includes(b.id) ? 'bg-foreground text-primary-foreground border-foreground' : 'border-border hover:bg-secondary'}`}>
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={!form.name} className="w-full bg-foreground text-primary-foreground">
              {editingId ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password modal */}
      {passwordModalId && (
        <Dialog open={true} onOpenChange={() => setPasswordModalId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Пароль — {state.staff.find(m => m.id === passwordModalId)?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Новый пароль</Label>
                <div className="relative">
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    value={passwordForm.password}
                    onChange={e => setPasswordForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Введите пароль..."
                    className="pr-9"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <Icon name={showPwd ? 'EyeOff' : 'Eye'} size={15} />
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Подтвердите пароль</Label>
                <Input
                  type={showPwd ? 'text' : 'password'}
                  value={passwordForm.confirm}
                  onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Повторите пароль..."
                />
                {passwordForm.confirm && passwordForm.password !== passwordForm.confirm && (
                  <p className="text-xs text-red-500 mt-1">Пароли не совпадают</p>
                )}
              </div>
              <Button
                onClick={savePassword}
                disabled={!passwordForm.password || passwordForm.password !== passwordForm.confirm}
                className="w-full bg-foreground text-primary-foreground"
              >
                Сохранить пароль
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Invite link modal */}
      {inviteModalId && (
        <Dialog open={true} onOpenChange={() => setInviteModalId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Ссылка для входа — {state.staff.find(m => m.id === inviteModalId)?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Отправьте эту ссылку сотруднику. По клику он автоматически войдёт в систему без пароля.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground break-all font-mono">
                  {inviteLink}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={copyInviteLink}
                  className={`flex-1 ${linkCopied ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-foreground hover:opacity-90'} text-primary-foreground`}
                >
                  <Icon name={linkCopied ? 'Check' : 'Copy'} size={14} className="mr-1.5" />
                  {linkCopied ? 'Скопировано!' : 'Скопировать'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => regenerateLink(inviteModalId)}
                  title="Сгенерировать новую ссылку (старая перестанет работать)"
                >
                  <Icon name="RefreshCw" size={14} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Кнопка <Icon name="RefreshCw" size={11} className="inline" /> сбросит старую ссылку и создаст новую.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Permissions editor */}
      {editingMember && permsForm && (
        <Dialog open={true} onOpenChange={() => { setEditPermsId(null); setPermsForm(null); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Права доступа — {editingMember.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1 mb-4">
              <p className="text-xs text-muted-foreground">Быстрый сброс до стандартных прав роли:</p>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(ROLE_LABELS) as [StaffRole, string][]).map(([role, label]) => (
                  <button key={role} onClick={() => resetPermsToRole(role)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${editingMember.role === role ? 'bg-foreground text-primary-foreground border-foreground' : 'border-border hover:bg-secondary'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name={group.icon} size={15} className="text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group.label}</span>
                  </div>
                  <div className="space-y-2 pl-5">
                    {group.keys.map(key => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => setPermsForm(p => p ? { ...p, [key]: !p[key] } : p)}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${permsForm[key] ? 'bg-emerald-500' : 'bg-secondary border border-border'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${permsForm[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="text-sm">{PERMISSION_LABELS[key]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Доступные пункты меню */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="Menu" size={15} className="text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Доступные пункты меню</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-5">
                  {MENU_ITEMS.map(item => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setPermsForm(p => p ? { ...p, [item.key]: !p[item.key] } : p)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${permsForm[item.key] ? 'bg-emerald-500' : 'bg-secondary border border-border'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${permsForm[item.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      <Icon name={item.icon} size={13} className="text-muted-foreground shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={savePerms} className="w-full mt-4 bg-foreground text-primary-foreground">
              Сохранить права
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}