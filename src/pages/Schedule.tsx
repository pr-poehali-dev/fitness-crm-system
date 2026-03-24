import { useState } from 'react';
import { StoreType } from '@/store';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ClientCard from '@/components/ClientCard';

interface ScheduleProps {
  store: StoreType;
  onSell?: (clientId?: string) => void;
}

export default function Schedule({ store, onSell }: ScheduleProps) {
  const { state, addScheduleEntry, enrollClient, markVisit } = store;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [form, setForm] = useState({ trainingTypeId: '', trainerId: '', time: '09:00', maxCapacity: 15 });
  const [enrollSearch, setEnrollSearch] = useState('');
  const [openClientId, setOpenClientId] = useState<string | null>(null);

  const branchEntries = state.schedule.filter(e => e.branchId === state.currentBranchId && e.date === selectedDate);
  const selectedEntry = selectedEntryId ? state.schedule.find(e => e.id === selectedEntryId) : null;

  const getDates = () => {
    const dates = [];
    for (let i = -1; i <= 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return { day: d.toLocaleDateString('ru-RU', { weekday: 'short' }), date: d.getDate() };
  };

  const handleAddEntry = () => {
    if (!form.trainingTypeId || !form.trainerId) return;
    addScheduleEntry({
      trainingTypeId: form.trainingTypeId,
      trainerId: form.trainerId,
      branchId: state.currentBranchId,
      date: selectedDate,
      time: form.time,
      maxCapacity: form.maxCapacity,
    });
    setShowAdd(false);
    setForm({ trainingTypeId: '', trainerId: '', time: '09:00', maxCapacity: 15 });
  };

  const filteredClients = state.clients.filter(c =>
    c.branchId === state.currentBranchId &&
    selectedEntry && !selectedEntry.enrolledClientIds.includes(c.id) &&
    `${c.lastName} ${c.firstName} ${c.phone}`.toLowerCase().includes(enrollSearch.toLowerCase())
  );

  const handleMarkVisit = (clientId: string, entryId: string, status: 'attended' | 'missed' | 'cancelled') => {
    const visit = state.visits.find(v => v.clientId === clientId && v.scheduleEntryId === entryId);
    if (!visit) return;
    const sub = state.clients.find(c => c.id === clientId)?.activeSubscriptionId || null;
    if (status === 'cancelled') {
      markVisit(visit.id, 'missed', sub, false, 0);
    } else {
      markVisit(visit.id, status, sub, false, 0);
    }
  };

  // Helpers for badges
  const isFirstEverTraining = (clientId: string) => {
    const clientVisits = state.visits.filter(v => v.clientId === clientId && v.status !== 'enrolled');
    return clientVisits.length === 0;
  };

  const isSubEndingToday = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    if (!client?.activeSubscriptionId) return false;
    const sub = state.subscriptions.find(s => s.id === client.activeSubscriptionId);
    if (!sub) return false;
    const today = new Date().toISOString().split('T')[0];
    return sub.endDate <= today;
  };

  const openClientCard = state.clients.find(c => c.id === openClientId);

  if (openClientCard) {
    return (
      <div className="animate-fade-in">
        <button onClick={() => setOpenClientId(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <Icon name="ArrowLeft" size={14} /> Назад в расписание
        </button>
        <ClientCard
          client={openClientCard}
          store={store}
          onClose={() => setOpenClientId(null)}
          onSell={() => onSell?.(openClientCard.id)}
        />
      </div>
    );
  }

  return (
    <div className="flex gap-5 h-full animate-fade-in">
      {/* Left: schedule */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Date strip */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {getDates().map(d => {
            const { day, date } = formatDate(d);
            const isToday = d === new Date().toISOString().split('T')[0];
            const isSelected = d === selectedDate;
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center px-3 py-2.5 rounded-xl shrink-0 transition-colors ${isSelected ? 'bg-foreground text-primary-foreground' : 'bg-white border border-border hover:bg-secondary'}`}
              >
                <span className="text-xs capitalize">{day}</span>
                <span className={`text-lg font-semibold leading-tight ${isToday && !isSelected ? 'text-blue-600' : ''}`}>{date}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowAdd(true)}
            className="flex flex-col items-center px-3 py-2.5 rounded-xl shrink-0 border border-dashed border-border hover:bg-secondary transition-colors"
          >
            <Icon name="Plus" size={20} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-0.5">Добавить</span>
          </button>
        </div>

        {/* Entries */}
        <div className="space-y-3 flex-1 overflow-y-auto">
          {branchEntries.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="Calendar" size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">Нет занятий на этот день</div>
            </div>
          )}
          {branchEntries.sort((a, b) => a.time.localeCompare(b.time)).map(entry => {
            const tt = state.trainingTypes.find(t => t.id === entry.trainingTypeId);
            const trainer = state.trainers.find(t => t.id === entry.trainerId);
            const enrolledCount = entry.enrolledClientIds.length;
            const fillPct = (enrolledCount / entry.maxCapacity) * 100;
            const isSelected = selectedEntryId === entry.id;
            return (
              <div key={entry.id}>
                <div
                  onClick={() => setSelectedEntryId(entry.id === selectedEntryId ? null : entry.id)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${isSelected ? 'border-foreground shadow-sm' : 'border-border hover:shadow-sm'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-1 h-12 rounded-full shrink-0 mt-0.5" style={{ background: tt?.color || '#888' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{entry.time}</span>
                        <span className="font-medium">{tt?.name}</span>
                        <span className="text-sm text-muted-foreground">{tt?.duration} мин</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">{trainer?.name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium">{enrolledCount} / {entry.maxCapacity}</div>
                      <div className="w-16 h-1.5 bg-secondary rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-foreground rounded-full" style={{ width: `${fillPct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: entry detail */}
      {selectedEntry && (() => {
        const tt = state.trainingTypes.find(t => t.id === selectedEntry.trainingTypeId);
        const trainer = state.trainers.find(t => t.id === selectedEntry.trainerId);
        return (
          <div className="w-96 shrink-0 bg-white border border-border rounded-xl overflow-hidden flex flex-col animate-slide-in-right">
            <div className="px-4 py-4 border-b border-border" style={{ borderTop: `3px solid ${tt?.color || '#888'}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{tt?.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedEntry.time} · {tt?.duration} мин</div>
                  <div className="text-xs text-muted-foreground mt-1">{trainer?.name}</div>
                </div>
                <button onClick={() => setSelectedEntryId(null)} className="text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={15} />
                </button>
              </div>
            </div>

            {/* Enrolled list */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Записанные ({selectedEntry.enrolledClientIds.length})
              </div>

              {selectedEntry.enrolledClientIds.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">Никто не записан</div>
              )}

              {selectedEntry.enrolledClientIds.map(clientId => {
                const client = state.clients.find(c => c.id === clientId);
                const visit = state.visits.find(v => v.clientId === clientId && v.scheduleEntryId === selectedEntry.id);
                if (!client) return null;

                const isFirst = isFirstEverTraining(clientId);
                const subEnding = isSubEndingToday(clientId);
                const clientSub = client.activeSubscriptionId ? state.subscriptions.find(s => s.id === client.activeSubscriptionId) : null;

                const statusMap: Record<string, { label: string; color: string; icon: string }> = {
                  attended: { label: 'Пришёл', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: 'Check' },
                  missed: { label: 'Не пришёл', color: 'text-red-600 bg-red-50 border-red-200', icon: 'X' },
                  enrolled: { label: 'Записан', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: 'Clock' },
                };
                const currentStatus = visit?.status || 'enrolled';
                const statusInfo = statusMap[currentStatus] || statusMap.enrolled;

                return (
                  <div key={clientId} className="px-4 py-3 border-b border-border last:border-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setOpenClientId(clientId)}
                            className="text-sm font-medium hover:underline text-left"
                          >
                            {client.lastName} {client.firstName}
                          </button>
                          {isFirst && (
                            <span title="Первая тренировка" className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">1-й раз</span>
                          )}
                          {subEnding && (
                            <span title="Абонемент истекает сегодня" className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">⚠ абон. кончается</span>
                          )}
                        </div>
                        {client.comment && (
                          <div className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                            <span>💬</span>
                            <span className="truncate">{client.comment}</span>
                          </div>
                        )}
                        {clientSub && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {clientSub.planName} · {clientSub.sessionsLeft === 'unlimited' ? '∞' : `${clientSub.sessionsLeft} зан.`}
                          </div>
                        )}
                      </div>

                      {/* Status actions */}
                      {visit && (
                        <div className="shrink-0 flex flex-col gap-1 items-end">
                          {currentStatus === 'enrolled' ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleMarkVisit(clientId, selectedEntry.id, 'attended')}
                                className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors font-medium"
                              >
                                ✓ Пришёл
                              </button>
                              <button
                                onClick={() => handleMarkVisit(clientId, selectedEntry.id, 'missed')}
                                className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors font-medium"
                              >
                                ✗ Нет
                              </button>
                              <button
                                onClick={() => handleMarkVisit(clientId, selectedEntry.id, 'cancelled')}
                                className="text-xs px-2 py-1 rounded-lg bg-secondary text-muted-foreground border border-border hover:bg-secondary/80 transition-colors font-medium"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enroll new client */}
            <div className="px-4 py-3 border-t border-border bg-secondary/30">
              <div className="text-xs font-medium text-muted-foreground mb-2">Записать клиента</div>
              <Input
                value={enrollSearch}
                onChange={e => setEnrollSearch(e.target.value)}
                placeholder="Поиск по имени или телефону..."
                className="text-sm mb-2"
              />
              {enrollSearch && (
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {filteredClients.slice(0, 8).map(c => (
                    <button
                      key={c.id}
                      onClick={() => { enrollClient(selectedEntry.id, c.id); setEnrollSearch(''); }}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-border transition-colors"
                    >
                      <span className="font-medium">{c.lastName} {c.firstName}</span>
                      <span className="text-muted-foreground ml-2">{c.phone}</span>
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="text-sm text-muted-foreground px-3 py-2">Клиент не найден</div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Add entry modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Добавить занятие</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Тип тренировки *</Label>
              <select className="w-full border border-input rounded-lg px-3 py-2 text-sm"
                value={form.trainingTypeId} onChange={e => setForm(f => ({ ...f, trainingTypeId: e.target.value }))}>
                <option value="">Выбрать...</option>
                {state.trainingTypes.filter(t => t.branchIds.includes(state.currentBranchId)).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Тренер *</Label>
              <select className="w-full border border-input rounded-lg px-3 py-2 text-sm"
                value={form.trainerId} onChange={e => setForm(f => ({ ...f, trainerId: e.target.value }))}>
                <option value="">Выбрать...</option>
                {state.trainers.filter(t => t.branchId === state.currentBranchId).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Время</Label>
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Мест</Label>
                <Input type="number" value={form.maxCapacity} onChange={e => setForm(f => ({ ...f, maxCapacity: Number(e.target.value) }))} />
              </div>
            </div>
            <Button onClick={handleAddEntry} disabled={!form.trainingTypeId || !form.trainerId} className="w-full bg-foreground text-primary-foreground">
              Добавить занятие
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
