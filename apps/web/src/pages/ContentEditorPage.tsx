/**
 * ContentEditorPage — thin wrapper that imports the ContentEditor component
 * defined in the legacy App.tsx. Once App.tsx is the router shell, the
 * ContentEditor function is exposed as a named export.
 */
export { ContentEditor as default } from '../App';
