"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

type ContactItem = {
  id: number;
  section: string;
  label: string;
  value: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

const DEFAULT_ITEMS = [
  {
    section: "About Us",
    label: "Department",
    value: "Department of Pharmacy, Daffodil International University",
    icon: "🏫",
  },
  {
    section: "About Us",
    label: "Club",
    value: "Pharmacia Club DIU",
    icon: "💊",
  },
  {
    section: "About Us",
    label: "Batch",
    value: "30th Batch",
    icon: "🎓",
  },
  {
    section: "Official",
    label: "Official Email",
    value: "diupc@diu.edu.bd",
    icon: "📧",
  },
  {
    section: "Official",
    label: "Facebook Page",
    value: "https://www.facebook.com/PharmaciaClubDIU",
    icon: "📘",
  },
  {
    section: "Official",
    label: "LinkedIn",
    value: "",
    icon: "💼",
  },
  {
    section: "Official",
    label: "Instagram",
    value: "",
    icon: "📸",
  },
  {
    section: "Department",
    label: "Facebook Page",
    value: "",
    icon: "📘",
  },
  {
    section: "Department",
    label: "Facebook Group",
    value: "",
    icon: "👥",
  },
  {
    section: "Department",
    label: "Department Website",
    value: "",
    icon: "🌐",
  },
  {
    section: "Department",
    label: "Department Email",
    value: "",
    icon: "📧",
  },
];

export default function AdminContactPage() {
  const supabase = createClient();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [items, setItems] = useState<ContactItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);

  const [error, setError] = useState("");
  const [itemsError, setItemsError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [section, setSection] = useState("Official");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [icon, setIcon] = useState("🔗");

  const [saving, setSaving] = useState(false);

  // ============================================================
  // LOAD CONTACT MESSAGES
  // ============================================================

  async function loadMessages() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setMessages([]);
    } else {
      setMessages(data || []);
    }

    setLoading(false);
  }

  // ============================================================
  // LOAD CONTACT ITEMS
  // ============================================================

  async function loadItems() {
    setItemsLoading(true);
    setItemsError("");

    const { data, error } = await supabase
      .from("contact_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      setItemsError(error.message);
      setItems([]);
    } else {
      setItems(data || []);
    }

    setItemsLoading(false);
  }

  useEffect(() => {
    loadMessages();
    loadItems();
  }, []);

  // ============================================================
  // CREATE DEFAULT CONTACT ITEMS
  // ============================================================

  async function createDefaultItems() {
    const confirmed = window.confirm(
      "Create the existing Contact page information in the admin panel?"
    );

    if (!confirmed) return;

    const records = DEFAULT_ITEMS.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));

    const { error } = await supabase
      .from("contact_items")
      .insert(records);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "All existing Contact page items have been added to the admin panel."
    );

    await loadItems();
  }

  // ============================================================
  // RESET FORM
  // ============================================================

  function resetForm() {
    setEditingId(null);
    setSection("Official");
    setLabel("");
    setValue("");
    setIcon("🔗");
    setShowForm(false);
  }

  // ============================================================
  // EDIT ITEM
  // ============================================================

  function editItem(item: ContactItem) {
    setEditingId(item.id);
    setSection(item.section);
    setLabel(item.label);
    setValue(item.value);
    setIcon(item.icon || "🔗");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ============================================================
  // ADD / UPDATE ITEM
  // ============================================================

  async function saveItem() {
    if (!section.trim()) {
      alert("Please select a section.");
      return;
    }

    if (!label.trim()) {
      alert("Please enter a label.");
      return;
    }

    setSaving(true);

    try {
      if (editingId !== null) {
        const { error } = await supabase
          .from("contact_items")
          .update({
            section: section.trim(),
            label: label.trim(),
            value: value.trim(),
            icon: icon.trim() || "🔗",
          })
          .eq("id", editingId);

        if (error) {
          alert(error.message);
          return;
        }

        alert("Contact information updated successfully.");
      } else {
        const maxSort =
          items.length > 0
            ? Math.max(...items.map((item) => item.sort_order || 0))
            : 0;

        const { error } = await supabase
          .from("contact_items")
          .insert({
            section: section.trim(),
            label: label.trim(),
            value: value.trim(),
            icon: icon.trim() || "🔗",
            sort_order: maxSort + 1,
          });

        if (error) {
          alert(error.message);
          return;
        }

        alert("Contact information added successfully.");
      }

      resetForm();
      await loadItems();
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // DELETE ITEM
  // ============================================================

  async function deleteItem(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this item from the Contact page?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("contact_items")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadItems();
  }

  // ============================================================
  // MESSAGE STATUS
  // ============================================================

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadMessages();
  }

  // ============================================================
  // DELETE MESSAGE
  // ============================================================

  async function deleteMessage(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadMessages();
  }

  // ============================================================
  // GROUP ITEMS
  // ============================================================

  const aboutItems = items.filter(
    (item) => item.section === "About Us"
  );

  const officialItems = items.filter(
    (item) => item.section === "Official"
  );

  const departmentItems = items.filter(
    (item) => item.section === "Department"
  );

  // ============================================================
  // ITEM CARD
  // ============================================================

  function ItemCard({ item }: { item: ContactItem }) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex min-w-0 items-center gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
            {item.icon || "🔗"}
          </div>

          <div className="min-w-0">

            <p className="font-bold text-[#0b1736] dark:text-white">
              {item.label}
            </p>

            <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">
              {item.value || "Coming Soon"}
            </p>

          </div>

        </div>

        <div className="flex shrink-0 gap-2">

          <button
            type="button"
            onClick={() => editItem(item)}
            className="rounded-lg bg-[#0b1736] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#087f8c]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => deleteItem(item.id)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Remove
          </button>

        </div>

      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#0a0f1a] sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">

          <a
            href="/admin/dashboard"
            className="text-sm font-medium text-[#087f8c] hover:underline"
          >
            ← Back to Admin Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold text-[#0b1736] dark:text-white">
            Contact Page Management
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Edit, add, or remove anything displayed on the public Contact
            page.
          </p>

        </div>

        {/* ======================================================
            CONTACT PAGE CONTENT
        ====================================================== */}

        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-2xl font-bold text-[#0b1736] dark:text-white">
                Contact Page Information
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                These are the editable items that appear on your public
                Contact page.
              </p>

            </div>

            <button
              type="button"
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setEditingId(null);
                  setSection("Official");
                  setLabel("");
                  setValue("");
                  setIcon("🔗");
                  setShowForm(true);
                }
              }}
              className="rounded-lg bg-[#087f8c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066c76]"
            >
              {showForm ? "Cancel" : "+ Add Item"}
            </button>

          </div>

          {/* FORM */}

          {showForm && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">

              <h3 className="mb-4 text-lg font-bold text-[#0b1736] dark:text-white">
                {editingId !== null
                  ? "Edit Contact Page Item"
                  : "Add Contact Page Item"}
              </h3>

              <div className="grid gap-4 md:grid-cols-2">

                {/* SECTION */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Section
                  </label>

                  <select
                    value={section}
                    onChange={(e) =>
                      setSection(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  >

                    <option value="About Us">
                      About Us
                    </option>

                    <option value="Official">
                      Official
                    </option>

                    <option value="Department">
                      Department
                    </option>

                  </select>

                </div>

                {/* LABEL */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Label
                  </label>

                  <input
                    type="text"
                    value={label}
                    onChange={(e) =>
                      setLabel(e.target.value)
                    }
                    placeholder="Facebook Page"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />

                </div>

                {/* VALUE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Value / URL / Email
                  </label>

                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setValue(e.target.value)
                    }
                    placeholder="https://facebook.com/yourpage"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />

                </div>

                {/* ICON */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Icon
                  </label>

                  <input
                    type="text"
                    value={icon}
                    onChange={(e) =>
                      setIcon(e.target.value)
                    }
                    placeholder="📘"
                    maxLength={5}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />

                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={saveItem}
                  disabled={saving}
                  className="rounded-lg bg-[#0b1736] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Item"
                    : "Add Item"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                >
                  Cancel
                </button>

              </div>

            </div>
          )}

          {/* DATABASE ERROR */}

          {itemsError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">

              <p className="font-bold">
                Unable to load Contact page information.
              </p>

              <p className="mt-1">
                {itemsError}
              </p>

            </div>
          )}

          {/* NO ITEMS */}

          {!itemsLoading && !itemsError && items.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">

              <div className="text-4xl">
                📋
              </div>

              <h3 className="mt-3 font-bold text-[#0b1736] dark:text-white">
                Contact page items are not set up yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
                Your current Contact page contains several hard-coded
                information items. Click the button below to import all of
                those existing items into the admin panel.
              </p>

              <button
                type="button"
                onClick={createDefaultItems}
                className="mt-5 rounded-lg bg-[#087f8c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066c76]"
              >
                Import Existing Contact Items
              </button>

            </div>
          )}

          {/* LOADING */}

          {itemsLoading && (
            <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Loading Contact page information...
            </div>
          )}

          {/* ABOUT US */}

          {!itemsLoading && aboutItems.length > 0 && (
            <div className="mt-8">

              <h3 className="mb-3 text-lg font-bold text-[#0b1736] dark:text-white">
                About Us
              </h3>

              <div className="space-y-3">
                {aboutItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>

            </div>
          )}

          {/* OFFICIAL */}

          {!itemsLoading && officialItems.length > 0 && (
            <div className="mt-8">

              <h3 className="mb-3 text-lg font-bold text-[#0b1736] dark:text-white">
                Official
              </h3>

              <div className="space-y-3">
                {officialItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>

            </div>
          )}

          {/* DEPARTMENT */}

          {!itemsLoading && departmentItems.length > 0 && (
            <div className="mt-8">

              <h3 className="mb-3 text-lg font-bold text-[#0b1736] dark:text-white">
                Department
              </h3>

              <div className="space-y-3">
                {departmentItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>

            </div>
          )}

        </section>

        {/* ======================================================
            CONTACT MESSAGES
        ====================================================== */}

        <section>

          <div className="mb-6">

            <h2 className="text-2xl font-bold text-[#0b1736] dark:text-white">
              Contact Messages
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View and manage messages submitted through the Contact page.
            </p>

          </div>

          {/* LOADING */}

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              Loading messages...
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">

              <p className="font-semibold">
                Error loading messages
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>

            </div>
          )}

          {/* EMPTY */}

          {!loading && !error && messages.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">

              <div className="text-4xl">
                📭
              </div>

              <h2 className="mt-4 text-xl font-bold text-[#0b1736] dark:text-white">
                No messages yet
              </h2>

              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Messages submitted through the Contact page will appear here.
              </p>

            </div>
          )}

          {/* MESSAGES */}

          {!loading && !error && messages.length > 0 && (
            <div className="space-y-5">

              {messages.map((item) => {

                const isUnread =
                  item.status?.toLowerCase() === "unread";

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="text-xl font-bold text-[#0b1736] dark:text-white">
                            {item.subject || "No subject"}
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              isUnread
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {item.status || "Unread"}
                          </span>

                        </div>

                        <div className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">

                          <p>
                            <strong className="text-slate-700 dark:text-slate-300">
                              From:
                            </strong>{" "}
                            {item.name}
                          </p>

                          <p>
                            <strong className="text-slate-700 dark:text-slate-300">
                              Email:
                            </strong>{" "}

                            <a
                              href={`mailto:${item.email}`}
                              className="text-[#087f8c] hover:underline"
                            >
                              {item.email}
                            </a>
                          </p>

                          <p>
                            <strong className="text-slate-700 dark:text-slate-300">
                              Date:
                            </strong>{" "}

                            {new Date(
                              item.created_at
                            ).toLocaleString()}
                          </p>

                        </div>

                      </div>

                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              item.id,
                              isUnread
                                ? "Read"
                                : "Unread"
                            )
                          }
                          className="rounded-lg bg-[#0b1736] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#087f8c]"
                        >
                          {isUnread
                            ? "Mark as Read"
                            : "Mark as Unread"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteMessage(item.id)
                          }
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                    <div className="mt-5 rounded-xl bg-slate-50 p-5 dark:bg-slate-800/70">

                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                        {item.message}
                      </p>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}
