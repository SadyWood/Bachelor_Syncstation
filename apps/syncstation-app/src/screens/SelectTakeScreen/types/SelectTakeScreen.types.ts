export interface Take {
  id: string;
  number: number;
  name: string;
  description: string;
}

export interface SelectTakeScreenProps {
  onBack: () => void;
  onSelectTake: (take: Take) => void;
}
