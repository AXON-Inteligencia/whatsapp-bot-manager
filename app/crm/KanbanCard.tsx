"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Contact, FunnelStage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  contact: Contact;
  index: number;
}

function formatTimeAgo(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function KanbanCard({ contact, index }: KanbanCardProps) {
  const router = useRouter();

  return (
    <Draggable draggableId={contact.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          className={cn("mb-3", snapshot.isDragging && "opacity-70")}
        >
          <Card 
            className="p-3 bg-card border-border cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
            onClick={() => router.push(`/conversations?contact=${contact.id}`)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-primary">
                {contact.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{contact.name}</p>
                <p className="text-xs text-muted-foreground truncate">{contact.phone}</p>
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {formatTimeAgo(contact.lastContact)}
              </span>
            </div>

            {/* Simulação de última mensagem */}
            <p className="text-xs text-muted-foreground truncate italic mb-2">
              Última mensagem enviada...
            </p>

            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1 flex-wrap">
                {contact.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-[10px] bg-secondary border-0 px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {/* Badges de Intenção (Venda/Suporte) simulados pelo estágio */}
              {contact.funnelStage === 'negotiating' && (
                <Badge className="bg-green-500/10 text-green-500 border-0 text-[10px] px-1.5 py-0 hover:bg-green-500/20">
                  🟢 Venda
                </Badge>
              )}
              {contact.funnelStage === 'support' && (
                <Badge className="bg-blue-500/10 text-blue-500 border-0 text-[10px] px-1.5 py-0 hover:bg-blue-500/20">
                  🔵 Suporte
                </Badge>
              )}
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
