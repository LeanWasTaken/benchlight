import { warnOnce } from "./dev.js";
function controlId(name, field, id) {
  if (!field) return id;
  if (id !== void 0 && id !== field.id.value)
    warnOnce(
      `${name}: \`id\` is ignored inside a BlField, whose label targets the field's id; set \`id\` on BlField instead.`
    );
  return field.id.value;
}
export {
  controlId
};
