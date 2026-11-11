import { Comment, Text, Fragment } from "vue";
function hasContent(nodes) {
  return (nodes ?? []).some((node) => {
    if (node.type === Comment) return false;
    if (node.type === Text) return typeof node.children === "string" && node.children.trim() !== "";
    if (node.type === Fragment)
      return Array.isArray(node.children) && hasContent(node.children);
    return true;
  });
}
export {
  hasContent
};
