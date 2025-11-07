# Group12_IT4409
import Button from "./components/ui/Button";

export default function Toolbar() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Button>Post</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="ghost" size="sm">Preview</Button>
      <Button variant="primary" size="lg" loading>Submitting…</Button>
      {/* As a link: */}
      <Button as="a" href="/settings" variant="outline">Settings</Button>
    </div>
  );
}


//use css rules

1.
export function PostHeader({ title, subtitle }) {
  return (
    <header className="p-16">
      <h1 className="h1">{title}</h1>
      <p className="caption mt-8">{subtitle}</p>
    </header>
  );
}


2.
export function Alert({ kind = "danger", children }) {
  const map = {
    success: "bg-white text-black border",
    warning: "bg-white text-black border",
    danger:  "bg-white text-black border",
    info:    "bg-white text-black border"
  };
  const bar = {
    success: "bg-primary-300",
    warning: "bg-neutral-3",
    danger:  "bg-neutral-3",
    info:    "bg-neutral-3"
  };

  return (
    <div className={`rounded p-16 ${map[kind]}`}>
      <div className={`rounded mb-12 ${bar[kind]}`} style={{ height: 6 }} />
      <div className="text-gray">{children}</div>
    </div>
  );
}


3.
<span className="text-gray caption-2">2h ago</span>
<div className="bg-primary-500 rounded p-12 text-white">badge</div>


//typography
// Example: PostHeader.jsx
export default function PostHeader() {
  return (
    <header>
      <h1 className="h1">Display / H1</h1>
      <h2 className="h2">Heading / H2</h2>
      <h3 className="h3">Title / H3</h3>

      <p className="body">Body / Regular</p>
      <p className="body-md">Body / Medium</p>

      <p className="caption">Caption</p>
      <span className="caption-2">mini caption</span>
    </header>
  );
}



//remember navbar n sidebar components