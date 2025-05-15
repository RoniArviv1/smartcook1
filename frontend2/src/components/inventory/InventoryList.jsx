import React, { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { AlertTriangle, Pencil, Save, Trash2, X } from "lucide-react";

export default function InventoryList({ ingredients, loading, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleEdit = (ingredient) => {
    setEditingId(ingredient.id);
    setEditForm(ingredient);
  };

  const handleSave = async () => {
    await onUpdate(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const getExpiryStatus = (date) => {
    if (!date) return null;
    const daysUntilExpiry = differenceInDays(new Date(date), new Date());
    if (daysUntilExpiry <= 0) return "expired";
    if (daysUntilExpiry <= 3) return "expiring-soon";
    return "good";
  };

  if (loading) return <p>Loading inventory...</p>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ backgroundColor: "#f2f2f2" }}>
          <th>Name</th>
          <th>Category</th>
          <th>Quantity</th>
          <th>Expiry Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {ingredients.map((ingredient) => (
          <tr key={ingredient.id} style={{ borderBottom: "1px solid #ddd" }}>
            <td>
              {editingId === ingredient.id ? (
                <input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              ) : (
                ingredient.name
              )}
            </td>
            <td>
              {editingId === ingredient.id ? (
                <input
                  value={editForm.category || ""}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                />
              ) : (
                ingredient.category
              )}
            </td>
            <td>
              {editingId === ingredient.id ? (
                <>
                  <input
                    type="number"
                    value={editForm.quantity || ""}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) })}
                    style={{ width: "60px", marginRight: "4px" }}
                  />
                  <input
                    value={editForm.unit || ""}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    style={{ width: "60px" }}
                  />
                </>
              ) : (
                `${ingredient.quantity} ${ingredient.unit}`
              )}
            </td>
            <td>
              {editingId === ingredient.id ? (
                <input
                  type="date"
                  value={editForm.expiry_date || ""}
                  onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                />
              ) : (
                ingredient.expiry_date ? (
                  <>
                    {format(new Date(ingredient.expiry_date), "MMM d, yyyy")}
                    {getExpiryStatus(ingredient.expiry_date) === "expired" && (
                      <span style={{ color: "red", marginLeft: "8px" }}>Expired</span>
                    )}
                    {getExpiryStatus(ingredient.expiry_date) === "expiring-soon" && (
                      <span style={{ color: "orange", marginLeft: "8px" }}>
                        <AlertTriangle className="inline w-3 h-3" /> Expiring Soon
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: "gray" }}>No Date</span>
                )
              )}
            </td>
            <td>
              {editingId === ingredient.id ? (
                <>
                  <button onClick={handleCancel} title="Cancel">
                    <X className="inline w-4 h-4" />
                  </button>
                  <button onClick={handleSave} title="Save" style={{ color: "green", marginLeft: "6px" }}>
                    <Save className="inline w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleEdit(ingredient)} title="Edit">
                    <Pencil className="inline w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(ingredient.id)}
                    title="Delete"
                    style={{ color: "red", marginLeft: "6px" }}
                  >
                    <Trash2 className="inline w-4 h-4" />
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}