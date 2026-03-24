import { useState } from 'react';
import { StoreType } from '@/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface InquiryModalProps {
  open: boolean;
  onClose: () => void;
  store: StoreType;
}

export default function InquiryModal({ open, onClose, store }: InquiryModalProps) {
  const { state, addInquiry } = store;
  const [channel, setChannel] = useState('');
  const [adSource, setAdSource] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!channel) return;
    addInquiry({
      branchId: state.currentBranchId,
      date: new Date().toISOString().split('T')[0],
      channel,
      adSource,
      note,
    });
    setChannel('');
    setAdSource('');
    setNote('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="PhoneIncoming" size={16} />
            Зафиксировать обращение
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Обращение без регистрации клиента — звонок, сообщение, визит
        </p>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Канал связи *</Label>
            <div className="flex flex-wrap gap-2">
              {state.contactChannels.map(ch => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${channel === ch ? 'bg-foreground text-primary-foreground border-foreground' : 'border-border hover:bg-secondary'}`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Рекламный источник</Label>
            <div className="flex flex-wrap gap-2">
              {state.adSources.map(src => (
                <button
                  key={src}
                  onClick={() => setAdSource(adSource === src ? '' : src)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${adSource === src ? 'bg-foreground text-primary-foreground border-foreground' : 'border-border hover:bg-secondary'}`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Заметка</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Что интересовалось, когда перезвонить..."
              rows={2}
            />
          </div>

          <Button onClick={handleSubmit} disabled={!channel} className="w-full bg-foreground text-primary-foreground hover:opacity-90">
            Зафиксировать
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
