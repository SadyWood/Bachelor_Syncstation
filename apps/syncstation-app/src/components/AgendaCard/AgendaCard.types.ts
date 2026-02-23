export interface AgendaItem {
    id: string;
    time: string;
    title: string;
    isCompleted: boolean;
  }
  
  export interface AgendaCardProps {
    items: AgendaItem[];
    onItemToggle: (id: string) => void;
  }