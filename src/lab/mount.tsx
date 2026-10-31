import { createRoot, type Root } from 'react-dom/client';
import Lab from './Lab';
import './lab.css';

let root: Root | null = null;

export function mountLab(el: HTMLElement) {
  if (root) return;
  root = createRoot(el);
  root.render(<Lab />);
}
