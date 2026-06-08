import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating /App.jsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" })).toBe("Editing /components/Card.jsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/utils/helpers.ts" })).toBe("Editing /utils/helpers.ts");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Reading /App.jsx");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })).toBe("Renaming /old.jsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/old.jsx" })).toBe("Deleting /old.jsx");
});

test("getToolLabel: unknown tool with path falls back to path", () => {
  expect(getToolLabel("some_other_tool", { path: "/file.ts" })).toBe("/file.ts");
});

test("getToolLabel: unknown tool without path falls back to toolName", () => {
  expect(getToolLabel("some_other_tool", {})).toBe("some_other_tool");
});

// --- ToolInvocationBadge render tests ---

test("ToolInvocationBadge shows friendly label when result is present", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  // Green dot present, no spinner
  expect(document.querySelector(".bg-emerald-500")).toBeTruthy();
  expect(document.querySelector(".animate-spin")).toBeNull();
});

test("ToolInvocationBadge shows spinner when in progress (call state)", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/components/Card.jsx" }}
      state="call"
    />
  );

  expect(screen.getByText("Editing /components/Card.jsx")).toBeDefined();
  expect(document.querySelector(".animate-spin")).toBeTruthy();
  expect(document.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocationBadge shows spinner when result is undefined", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result={undefined}
    />
  );

  expect(document.querySelector(".animate-spin")).toBeTruthy();
  expect(document.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocationBadge: file_manager delete label", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/old.jsx" }}
      state="result"
      result={{ success: true }}
    />
  );

  expect(screen.getByText("Deleting /old.jsx")).toBeDefined();
});
