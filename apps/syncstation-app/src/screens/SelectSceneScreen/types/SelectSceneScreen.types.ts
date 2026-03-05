export interface Scene {
  id: string;
  number: number;
  name: string;
  description: string;
  location: string;
}

export interface SelectSceneScreenProps {
  onBack: () => void;
  onSelectScene: (scene: Scene) => void;
}
