"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { KanbanCard } from "./KanbanCard";
import { FunnelStage, Contact } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLUMNS: { id: FunnelStage; label: string; color: string }[] = [
  { id: 'new_lead',    label: 'Novos Leads',   color: 'bg-zinc-500/10 text-zinc-500' },
  { id: 'negotiating', label: 'Em Negociação', color: 'bg-green-500/10 text-green-500' },
  { id: 'closed',      label: 'Fechados',      color: 'bg-blue-500/10 text-blue-500' },
  { id: 'support',     label: 'Suporte',       color: 'bg-orange-500/10 text-orange-500' },
];

export default function CRMPage() {
  const contacts = useAppStore(state => state.contacts);
  const updateContact = useAppStore(state => state.updateContact);
  const [columnsData, setColumnsData] = useState<Record<FunnelStage, Contact[]>>({
    new_lead: [], negotiating: [], closed: [], support: []
  });

  // Atualizar colunas quando contacts mudar
  useEffect(() => {
    const grouped = {
      new_lead: [], negotiating: [], closed: [], support: []
    } as Record<FunnelStage, Contact[]>;

    contacts.forEach(c => {
      const stage = c.funnelStage || 'new_lead';
      if (grouped[stage]) {
        grouped[stage].push(c);
      } else {
        grouped['new_lead'].push(c);
      }
    });

    setColumnsData(grouped);
  }, [contacts]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = source.droppableId as FunnelStage;
    const destColumn = destination.droppableId as FunnelStage;

    const sourceItems = Array.from(columnsData[sourceColumn]);
    const destItems = Array.from(columnsData[destColumn]);
    const [movedContact] = sourceItems.splice(source.index, 1);

    // Otimista: UI local
    if (sourceColumn === destColumn) {
      sourceItems.splice(destination.index, 0, movedContact);
      setColumnsData({ ...columnsData, [sourceColumn]: sourceItems });
    } else {
      movedContact.funnelStage = destColumn;
      destItems.splice(destination.index, 0, movedContact);
      setColumnsData({
        ...columnsData,
        [sourceColumn]: sourceItems,
        [destColumn]: destItems,
      });
      // Atualiza o Zustand optimista
      updateContact(draggableId, { funnelStage: destColumn });
    }

    // Chama a API se mudou de coluna
    if (sourceColumn !== destColumn) {
      try {
        const res = await fetch(`/api/contacts/${draggableId}/stage`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: destColumn })
        });
        if (!res.ok) throw new Error("Falha na API");
      } catch (err) {
        toast.error("Erro ao mover contato. Revertendo...");
        // Reverte (Zustand resolve isso se recarregarmos)
        updateContact(draggableId, { funnelStage: sourceColumn });
      }
    }
  };

  return (
    <DashboardLayout title="CRM (Kanban)" description="Gerencie o funil de vendas e atendimento">
      <div className="h-[calc(100vh-180px)] overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-max">
            {COLUMNS.map(column => (
              <div key={column.id} className="flex flex-col w-80 bg-secondary/30 rounded-xl overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-1 rounded text-xs font-semibold", column.color)}>
                      {column.label}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {columnsData[column.id]?.length || 0}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 p-3 overflow-y-auto transition-colors",
                        snapshot.isDraggingOver ? "bg-primary/5" : ""
                      )}
                    >
                      {columnsData[column.id]?.map((contact, index) => (
                        <KanbanCard key={contact.id} contact={contact} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </DashboardLayout>
  );
}
