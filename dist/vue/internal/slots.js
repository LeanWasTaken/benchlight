import { Comment, Fragment, Text } from "vue";
// vue/internal/slots.ts
function hasContent(nodes) {
	return (nodes ?? []).some((node) => {
		if (node.type === Comment) return false;
		if (node.type === Text) return typeof node.children === "string" && node.children.trim() !== "";
		if (node.type === Fragment) return Array.isArray(node.children) && hasContent(node.children);
		return true;
	});
}
export { hasContent };
