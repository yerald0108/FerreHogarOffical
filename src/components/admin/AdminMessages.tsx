import { useState, forwardRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Phone, Clock, Eye, EyeOff, Inbox, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function useContactMessages() {
  return useQuery({
    queryKey: ['admin-contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
  });
}

export const AdminMessages = forwardRef<HTMLDivElement>(function AdminMessages(_, ref) {
  const { data: messages, isLoading } = useContactMessages();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const markRead = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
    },
  });

  const deleteMsg = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
      toast.success('Mensaje eliminado');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const unreadCount = messages?.filter(m => !m.is_read).length || 0;

  if (isLoading) {
    return (
      <div ref={ref} className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {messages?.length || 0} mensajes
        </span>
        {unreadCount > 0 && (
          <Badge variant="default">{unreadCount} sin leer</Badge>
        )}
      </div>

      <div className="space-y-3">
        {messages?.map((msg) => {
          const isExpanded = expandedId === msg.id;
          return (
            <Card
              key={msg.id}
              className={`p-4 cursor-pointer transition-all ${!msg.is_read ? 'border-primary/50 bg-primary/5' : ''}`}
              onClick={() => {
                setExpandedId(isExpanded ? null : msg.id);
                if (!msg.is_read) {
                  markRead.mutate({ id: msg.id, is_read: true });
                }
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${msg.is_read ? 'bg-muted' : 'bg-primary/10'}`}>
                    {msg.is_read ? (
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Inbox className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-foreground ${!msg.is_read ? 'font-semibold' : ''}`}>
                        {msg.name}
                      </span>
                      {!msg.is_read && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">Nuevo</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground/80 truncate">{msg.subject}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {msg.email}
                      </span>
                      {msg.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {msg.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(msg.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    markRead.mutate({ id: msg.id, is_read: !msg.is_read });
                    toast.success(msg.is_read ? 'Marcado como no leído' : 'Marcado como leído');
                  }}
                >
                  {msg.is_read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t animate-fade-in">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                    <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`, '_blank');
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Responder por email
                    </Button>
                    {msg.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://wa.me/${msg.phone?.replace(/[^0-9]/g, '')}`, '_blank');
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('¿Eliminar este mensaje?')) deleteMsg.mutate(msg.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {messages?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
            No hay mensajes de contacto aún
          </div>
        )}
      </div>
    </div>
  );
});
