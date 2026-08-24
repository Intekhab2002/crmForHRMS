import TextFieldRenderer from "./renderers/TextFieldRenderer";


const rendererRegistry = {
  text: TextFieldRenderer,

};

export function getFieldRenderer(type) {
  return rendererRegistry[type] ?? null;
}

export function hasFieldRenderer(type) {
  return Boolean(rendererRegistry[type]);
}

export default rendererRegistry;