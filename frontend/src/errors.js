// Map Pydantic loc paths (e.g. "body.title", "body.questions.0.q") to human-friendly
// field names. Falls back to a prettified last segment.
const FIELD_LABELS = {
  title: "Title",
  content: "Content",
  description: "Description",
  tags: "Tags",
  questions: "Questions",
  q: "Question",
  options: "Options",
  correct_index: "Correct answer",
  marks: "Marks",
  name: "Name",
  content_file: "Content",
  login: "Username or email",
  password: "Password",
  email: "Email",
  username: "Username",
  bio: "Bio",
  text: "Comment",
  file: "Documentary",
  answers: "Answers",
  rid: "Repo id",
  qid: "Quiz id",
  bid: "Blog id",
  id: "Id",
};

function fieldLabel(loc) {
  if (!Array.isArray(loc) || loc.length === 0) return "Field";
  // Skip the leading "body" / "query" / "path" segment; use the last meaningful one.
  const parts = loc.filter((p) => p !== "body" && p !== "query" && p !== "path" && p !== "header");
  if (parts.length === 0) return "Field";
  const last = String(parts[parts.length - 1]);
  if (FIELD_LABELS[last]) return FIELD_LABELS[last];
  // If last is an array index (e.g. questions.0 -> 0), use the parent.
  if (/^\d+$/.test(last) && parts.length >= 2) {
    const parent = String(parts[parts.length - 2]);
    if (FIELD_LABELS[parent]) return FIELD_LABELS[parent];
    return parent.charAt(0).toUpperCase() + parent.slice(1);
  }
  return last.charAt(0).toUpperCase() + last.slice(1);
}

// Turn a single Pydantic error item into a human sentence.
function humanize(d) {
  const field = fieldLabel(d.loc);
  const t = d.type || "";
  const ctx = d.ctx || {};
  switch (t) {
    case "string_too_short":
      if (ctx.min_length === 1) return `${field} cannot be empty`;
      return `${field} must be at least ${ctx.min_length} characters`;
    case "string_too_long":
    case "value_error.any_str.max_length":
      return `${field} is too long (max ${ctx.max_length} characters)`;
    case "string_type":
      return `${field} must be text`;
    case "missing":
      return `${field} is required`;
    case "int_parsing":
    case "int_type":
      return `${field} must be a number`;
    case "too_short": // list
      return `${field} must have at least ${ctx.min_length} item${ctx.min_length === 1 ? "" : "s"}`;
    case "too_long": // list
      return `${field} must have at most ${ctx.max_length} item${ctx.max_length === 1 ? "" : "s"}`;
    case "greater_than_equal":
    case "value_error.number.not_ge":
      return `${field} must be at least ${ctx.ge}`;
    case "less_than_equal":
    case "value_error.number.not_le":
      return `${field} must be at most ${ctx.le}`;
    case "value_error":
      return d.msg || `${field} is invalid`;
    case "extra_forbidden":
      return `${field} is not allowed`;
    default:
      return d.msg ? `${field}: ${d.msg}` : `${field} is invalid`;
  }
}

// Extract a safe, renderable error message from an axios error response.
// - FastAPI HTTPException -> string "detail"
// - 422 validation error  -> list of objects -> humanized sentences
// - Anything else          -> string fallback
export function errorMessage(e, fallback = "failed") {
  const msgs = errorMessages(e, fallback);
  return msgs.join("\n");
}

// Returns an array of human-readable error strings, one per validation issue.
// Use this when you want each issue on its own line.
export function errorMessages(e, fallback = "failed") {
  const detail = e?.response?.data?.detail;
  if (typeof detail === "string") return [detail];
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (typeof d === "string" ? d : humanize(d)))
      .filter(Boolean);
    if (msgs.length) return msgs;
  }
  if (detail && typeof detail === "object") return [humanize(detail)];
  if (e?.message) return [e.message];
  return [fallback];
}