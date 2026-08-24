import TextFieldRenderer from "./renderers/TextFieldRenderer";
import TextareaFieldRenderer from "./renderers/TextareaFieldRenderer";
import NumberFieldRenderer from "./renderers/NumberFieldRenderer";
import EmailFieldRenderer from "./renderers/EmailFieldRenderer";
import SelectFieldRenderer from "./renderers/SelectFieldRenderer";
import CheckboxFieldRenderer from "./renderers/CheckboxFieldRenderer";
import SwitchFieldRenderer from "./renderers/SwitchFieldRenderer";
import DateFieldRenderer from "./renderers/DateFieldRenderer";
import DateTimeFieldRenderer from "./renderers/DateTimeFieldRenderer";
import TimeFieldRenderer from "./renderers/TimeFieldRenderer";

const rendererRegistry = Object.freeze({
  text: TextFieldRenderer,
  textarea: TextareaFieldRenderer,
  number: NumberFieldRenderer,
  email: EmailFieldRenderer,
  select: SelectFieldRenderer,
  checkbox: CheckboxFieldRenderer,
  switch: SwitchFieldRenderer,
  date: DateFieldRenderer,
  datetime: DateTimeFieldRenderer,
  time: TimeFieldRenderer,
});

export function getFieldRenderer(type) {
  return rendererRegistry[type] ?? null;
}

export function hasFieldRenderer(type) {
  return Boolean(
    rendererRegistry[type],
  );
}

export default rendererRegistry;