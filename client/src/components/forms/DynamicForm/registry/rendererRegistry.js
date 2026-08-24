import TextFieldRenderer from "./renderers/TextFieldRenderer";
import TextareaFieldRenderer from "./renderers/TextareaFieldRenderer";
import NumberFieldRenderer from "./renderers/NumberFieldRenderer";
import EmailFieldRenderer from "./renderers/EmailFieldRenderer";
import PasswordFieldRenderer from "./renderers/PasswordFieldRenderer";
import SelectFieldRenderer from "./renderers/SelectFieldRenderer";
import MultiSelectFieldRenderer from "./renderers/MultiSelectFieldRenderer";
import AutocompleteFieldRenderer from "./renderers/AutocompleteFieldRenderer";
import CheckboxFieldRenderer from "./renderers/CheckboxFieldRenderer";
import SwitchFieldRenderer from "./renderers/SwitchFieldRenderer";
import RadioFieldRenderer from "./renderers/RadioFieldRenderer";
import DateFieldRenderer from "./renderers/DateFieldRenderer";
import DateTimeFieldRenderer from "./renderers/DateTimeFieldRenderer";
import TimeFieldRenderer from "./renderers/TimeFieldRenderer";
import FileFieldRenderer from "./renderers/FileFieldRenderer";

const rendererRegistry = Object.freeze({
  text: TextFieldRenderer,
  textarea: TextareaFieldRenderer,
  number: NumberFieldRenderer,
  email: EmailFieldRenderer,
  password: PasswordFieldRenderer,
  select: SelectFieldRenderer,
  multi_select: MultiSelectFieldRenderer,
  autocomplete: AutocompleteFieldRenderer,
  checkbox: CheckboxFieldRenderer,
  switch: SwitchFieldRenderer,
  radio: RadioFieldRenderer,
  date: DateFieldRenderer,
  datetime: DateTimeFieldRenderer,
  time: TimeFieldRenderer,
  file: FileFieldRenderer,
});

export function getFieldRenderer(type) {
  return rendererRegistry[type] ?? null;
}

export function hasFieldRenderer(type) {
  return Boolean(rendererRegistry[type]);
}

export default rendererRegistry;