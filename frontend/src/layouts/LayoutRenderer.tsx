import { getComponent } from "./registry";
import type { LayoutDocument, LayoutNode, LayoutRenderMode, LayoutDataContext } from "./types";

type Props = {
  document: LayoutDocument;
  mode?: LayoutRenderMode;
  data: LayoutDataContext;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

function NodeView({
  node,
  mode,
  data,
  selectedId,
  onSelect,
}: {
  node: LayoutNode;
  mode: LayoutRenderMode;
  data: LayoutDataContext;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const def = getComponent(node.type);
  if (!def) {
    if (mode === "editor") {
      return (
        <div
          style={{ padding: 8, border: "1px dashed #ccc", fontSize: 12, color: "#888" }}
          onClick={() => onSelect?.(node.id)}
        >
          Unknown: {node.type}
        </div>
      );
    }
    return null;
  }
  const Render = def.Render;
  return (
    <Render
      node={node}
      mode={mode}
      data={data}
      selected={selectedId === node.id}
      onSelect={onSelect}
    >
      {node.children?.map((child) => (
        <NodeView
          key={child.id}
          node={child}
          mode={mode}
          data={data}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </Render>
  );
}

export function LayoutRenderer({
  document,
  mode = "live",
  data,
  selectedId,
  onSelect,
}: Props) {
  return (
    <NodeView
      node={document.root}
      mode={mode}
      data={data}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
}

export default LayoutRenderer;
