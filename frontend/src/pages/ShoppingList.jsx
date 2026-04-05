import { ShoppingCart, Plus, X, Check, Trash2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import toast from 'react-hot-toast';
import api from '../services/api';
import React, { useState, useEffect } from 'react';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Grains', 'Spices', 'Beverages', 'Other'];

const ShoppingList = () => {
    const [items, setItems] = useState([]);
    const [groupedItems, setGroupedItems] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [actionType, setActionType] = useState(null); 
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadShoppingList();
    }, []);

    const loadShoppingList = async () => {
        try {
            const response = await api.get('/shopping-list?grouped=true')
            const grouped = response.data.data.items

            const flatItems = []
            grouped.forEach(group => {
                group.items.forEach(item => {
                    flatItems.push({ ...item, category: group.category })
                })
            })
            setItems(flatItems)
            organizeByCategory(flatItems)
        } catch (error) {
            console.error(error)
            toast.error("Failed To Load Shopping List")
        } finally {
            setLoading(false)
        }
    };

    const organizeByCategory = (itemsList) => {
        const grouped = {};
        itemsList.forEach(item => {
            const category = item.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(item);
        });
        setGroupedItems(grouped);
    };

    const handleToggleChecked = async (id) => {
        try {
            await api.put(`/shopping-list/${id}/toggle`)
            const updatedItems = items.map(item =>
                item.id === id ? { ...item, is_checked: !item.is_checked } : item
            );
            setItems(updatedItems);
            organizeByCategory(updatedItems);
        } catch (error) {
            console.error(error)
            toast.error("Failed To Toggle")    
        } finally {
            setLoading(false)
        }
    };

    const handleDeleteItem = (id) => {
        setDeleteItemId(id);
    };

    const confirmDeleteItem = async () => {
        setDeleting(true);

        try {
            await api.delete(`/shopping-list/${deleteItemId}`);

            const updatedItems = items.filter(item => item.id !== deleteItemId);
            setItems(updatedItems);
            organizeByCategory(updatedItems);

            toast.success("Item deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed To Delete");
        } finally {
            setDeleting(false);
            setDeleteItemId(null);
        }
    };

    const handleClearChecked = () => {
        setActionType('clear');
    };

    const handleAddToPantry = () => {
        const checkedCount = items.filter(item => item.is_checked).length;

        if (checkedCount === 0) {
            toast.error('No items checked');
            return;
        }

        setActionType('pantry');
    };

    const confirmAction = async () => {
        setDeleting(true);

        try {
            if (actionType === 'clear') {
                await api.delete(`/shopping-list/clear/checked`);

                const updatedItems = items.filter(item => !item.is_checked);
                setItems(updatedItems);
                organizeByCategory(updatedItems);

                toast.success('Checked items cleared');
            }

            if (actionType === 'pantry') {
                await api.post(`/shopping-list/add-to-pantry`);

                const updatedItems = items.filter(item => !item.is_checked);
                setItems(updatedItems);
                organizeByCategory(updatedItems);

                toast.success('Items added to pantry');
            }

        } catch (error) {
            console.error(error);
            toast.error("Action failed");
        } finally {
            setDeleting(false);
            setActionType(null);
        }
    };

    if(loading){
        return(
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    const checkedCount = items.filter(item => item.is_checked).length;
    const totalCount = items.length;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
                    <p className="text-gray-600 mt-1">
                        {totalCount > 0 ? `${checkedCount} of ${totalCount} items checked` : 'Your shopping list is empty'}
                    </p>
                </div>

                {/* Actions */}
                {totalCount > 0 && (
                    <div className="flex flex-wrap gap-3 mb-6">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Item
                        </button>
                        {checkedCount > 0 && (
                            <>
                                <button
                                    onClick={handleAddToPantry}
                                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    Add to Pantry ({checkedCount})
                                </button>
                                <button
                                    onClick={handleClearChecked}
                                    className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Clear Checked
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Shopping List */}
                {totalCount > 0 ? (
                    <div className="space-y-6">
                        {Object.entries(groupedItems).map(([category, categoryItems]) => (
                            <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                    <h2 className="font-semibold text-gray-900">{category}</h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {categoryItems.map(item => (
                                        <ShoppingListItem
                                            key={item.id}
                                            item={item}
                                            onToggle={handleToggleChecked}
                                            onDelete={handleDeleteItem}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Your shopping list is empty</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add First Item
                        </button>
                    </div>
                )}
            </div>

            {actionType && (
                <DeleteConfirmModal
                    title={
                        actionType === 'clear'
                            ? "Clear Checked Items"
                            : "Add to Pantry"
                    }
                    description={
                        actionType === 'clear'
                            ? "Are you sure you want to remove all checked items?"
                            : `Add ${items.filter(i => i.is_checked).length} checked items to pantry?`
                    }
                    confirmText={
                        actionType === 'clear'
                            ? "Clear"
                            : "Add"
                    }
                    onClose={() => setActionType(null)}
                    onConfirm={confirmAction}
                    loading={deleting}
                    variant={actionType === 'clear' ? 'danger' : 'primary'}
                />
            )}

            {/* Add Item Modal */}
            {showAddModal && (
                <AddItemModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={(newItem) => {
                        // Add to local state
                        const updatedItems = [...items, newItem];
                        setItems(updatedItems);
                        organizeByCategory(updatedItems);
                        setShowAddModal(false);
                    }}
                />
            )}

            {/* Delete Modal */}
            {deleteItemId && (
                <DeleteConfirmModal
                    title="Delete Item"
                    description="Are you sure you want to delete this item?"
                    confirmText="Delete"
                    onClose={() => setDeleteItemId(null)}
                    onConfirm={confirmDeleteItem}
                    loading={deleting}
                />
            )}
        </div>
    );
};

const ShoppingListItem = ({ item, onToggle, onDelete }) => {
    return (
        <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
            <button
                onClick={() => onToggle(item.id)}
                className="shrink-0"
            >
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${item.is_checked
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-gray-300 hover:border-emerald-500'
                    }`}>
                    {item.is_checked && <Check className="w-4 h-4 text-white" />}
                </div>
            </button>

            <div className="flex-1 min-w-0">
                <p className={`font-medium ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {item.ingredient_name}
                </p>
                <p className={`text-sm ${item.is_checked ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.quantity} {item.unit}
                    {item.from_meal_plan && (
                        <span className="ml-2 text-xs text-emerald-600">• From meal plan</span>
                    )}
                </p>
            </div>

            <button
                onClick={() => onDelete(item.id)}
                className="shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

const AddItemModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        ingredient_name: '',
        quantity: '',
        unit: 'pieces',
        category: 'Other'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post(`/shopping-list`, {
                ...formData,
                quantity: parseFloat(formData.quantity)
            });

            const newItem = res.data.data.item;

            toast.success('Item added to shopping list');

            onSuccess(newItem);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed To Submit Form");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Add Item</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                        <input
                            type="text"
                            value={formData.ingredient_name}
                            onChange={(e) => setFormData({ ...formData, ingredient_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            >
                                <option value="pieces">Pieces</option>
                                <option value="kg">Kilograms</option>
                                <option value="g">Grams</option>
                                <option value="l">Liters</option>
                                <option value="ml">Milliliters</option>
                                <option value="cups">Cups</option>
                                <option value="tbsp">Tablespoons</option>
                                <option value="tsp">Teaspoons</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShoppingList;
