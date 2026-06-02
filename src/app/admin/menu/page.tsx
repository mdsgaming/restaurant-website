'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Check, X, Flame, Leaf, ShieldCheck, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMenuCategories,
  getMenuItems,
  addMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addAuditLog,
  submitPendingChange,
} from '@/lib/firestore'
import { formatPrice } from '@/lib/utils'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { MenuCategory, MenuItem } from '@/types'
import toast from 'react-hot-toast'
import { SectionLoader } from '@/components/ui/LoadingSpinner'

export default function AdminMenuPage() {
  const { appUser, role, isAssistant } = useAuth()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Modals
  const [categoryModal, setCategoryModal] = useState(false)
  const [itemModal, setItemModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'item'; id: string } | null>(null)

  // Forms
  const [catForm, setCatForm] = useState({ name: '', description: '' })
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
    isSpicy: false,
    isVegetarian: false,
    isGlutenFree: false,
    isFeatured: false,
  })

  async function load() {
    try {
      const [cats, its] = await Promise.all([getMenuCategories(), getMenuItems()])
      setCategories(cats)
      setItems(its)
      if (!activeCategory && cats.length > 0) setActiveCategory(cats[0].id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openNewCategory() {
    setEditingCategory(null)
    setCatForm({ name: '', description: '' })
    setCategoryModal(true)
  }

  function openEditCategory(cat: MenuCategory) {
    setEditingCategory(cat)
    setCatForm({ name: cat.name, description: cat.description || '' })
    setCategoryModal(true)
  }

  function openNewItem() {
    setEditingItem(null)
    setItemForm({ name: '', description: '', price: '', imageUrl: '', isAvailable: true, isSpicy: false, isVegetarian: false, isGlutenFree: false, isFeatured: false })
    setItemModal(true)
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
      isSpicy: item.isSpicy,
      isVegetarian: item.isVegetarian,
      isGlutenFree: item.isGlutenFree,
      isFeatured: item.isFeatured,
    })
    setItemModal(true)
  }

  async function saveCategory() {
    if (!catForm.name.trim()) return toast.error('Category name is required')
    try {
      if (editingCategory) {
        await updateMenuCategory(editingCategory.id, { name: catForm.name, description: catForm.description })
        toast.success('Category updated')
      } else {
        await addMenuCategory({ name: catForm.name, description: catForm.description, sortOrder: categories.length, isActive: true })
        toast.success('Category added')
      }
      await addAuditLog({ userId: appUser!.uid, userName: appUser!.name, userRole: appUser!.role, action: editingCategory ? 'updated menu category' : 'added menu category', resource: 'menuCategory', details: { name: catForm.name } })
      setCategoryModal(false)
      load()
    } catch (e) {
      toast.error('Failed to save category')
    }
  }

  async function saveItem() {
    if (!catForm && !activeCategory) return toast.error('Select a category first')
    if (!itemForm.name.trim()) return toast.error('Item name is required')
    if (!itemForm.price || isNaN(Number(itemForm.price))) return toast.error('Valid price is required')

    const data = {
      categoryId: activeCategory!,
      name: itemForm.name,
      description: itemForm.description,
      price: Number(itemForm.price),
      imageUrl: itemForm.imageUrl,
      isAvailable: itemForm.isAvailable,
      isSpicy: itemForm.isSpicy,
      isVegetarian: itemForm.isVegetarian,
      isGlutenFree: itemForm.isGlutenFree,
      isFeatured: itemForm.isFeatured,
      sortOrder: items.filter(i => i.categoryId === activeCategory).length,
    }

    try {
      if (isAssistant) {
        await submitPendingChange({
          type: editingItem ? 'MENU_ITEM_EDIT' : 'MENU_ITEM_ADD',
          description: `${editingItem ? 'Edit' : 'Add'} menu item: ${itemForm.name}`,
          data: editingItem ? { ...data, id: editingItem.id } : data,
          submittedById: appUser!.uid,
          submittedByName: appUser!.name,
        })
        toast.success('Change submitted for approval')
      } else {
        if (editingItem) {
          await updateMenuItem(editingItem.id, data)
          toast.success('Item updated')
        } else {
          await addMenuItem(data)
          toast.success('Item added')
        }
        await addAuditLog({ userId: appUser!.uid, userName: appUser!.name, userRole: appUser!.role, action: editingItem ? 'updated menu item' : 'added menu item', resource: 'menuItem', details: { name: itemForm.name } })
        load()
      }
      setItemModal(false)
    } catch (e) {
      toast.error('Failed to save item')
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    try {
      if (deleteConfirm.type === 'category') {
        await deleteMenuCategory(deleteConfirm.id)
        toast.success('Category deleted')
      } else {
        await deleteMenuItem(deleteConfirm.id)
        toast.success('Item deleted')
      }
      await addAuditLog({ userId: appUser!.uid, userName: appUser!.name, userRole: appUser!.role, action: `deleted ${deleteConfirm.type}`, resource: deleteConfirm.type, details: { id: deleteConfirm.id } })
      setDeleteConfirm(null)
      load()
    } catch (e) {
      toast.error('Delete failed')
    }
  }

  const activeCategoryItems = items.filter((i) => i.categoryId === activeCategory)

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-charcoal">Menu Management</h1>
          <p className="text-sm text-charcoal/50 mt-0.5">
            {isAssistant ? 'Changes will be submitted for admin approval.' : 'Manage categories and items.'}
          </p>
        </div>
        {isAssistant && <Badge variant="warning">Assistant — changes require approval</Badge>}
      </div>

      {loading ? (
        <SectionLoader />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories column */}
          <div className="lg:col-span-1">
            <div className="admin-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-charcoal text-sm">Categories</h2>
                <Button size="sm" onClick={openNewCategory}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-sm cursor-pointer transition-colors ${
                      activeCategory === cat.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-charcoal'
                    }`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <span className="flex-1 text-sm font-medium truncate">{cat.name}</span>
                    <span className="text-xs text-charcoal/40">
                      {items.filter((i) => i.categoryId === cat.id).length}
                    </span>
                    <div className="hidden group-hover:flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); openEditCategory(cat) }} className="p-1 text-gray-400 hover:text-primary">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'category', id: cat.id }) }} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No categories yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Items column */}
          <div className="lg:col-span-3">
            <div className="admin-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-charcoal text-sm">
                  Items {activeCategory && `— ${categories.find(c => c.id === activeCategory)?.name}`}
                </h2>
                <Button size="sm" onClick={openNewItem} disabled={!activeCategory}>
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </Button>
              </div>

              {activeCategoryItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No items in this category</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activeCategoryItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-3 group">
                      <GripVertical className="w-4 h-4 text-gray-200 shrink-0" />
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-sm" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-charcoal text-sm">{item.name}</span>
                          {item.isSpicy && <Flame className="w-3.5 h-3.5 text-red-500" />}
                          {item.isVegetarian && <Leaf className="w-3.5 h-3.5 text-emerald-600" />}
                          {item.isGlutenFree && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                          {item.isFeatured && <Star className="w-3.5 h-3.5 text-gold" />}
                        </div>
                        {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                      </div>
                      <span className="text-primary font-semibold text-sm">{formatPrice(item.price)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {item.isAvailable ? 'Available' : 'Off'}
                      </span>
                      <div className="hidden group-hover:flex gap-1">
                        <button onClick={() => openEditItem(item)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!isAssistant && (
                          <button onClick={() => setDeleteConfirm({ type: 'item', id: item.id })} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      <Modal isOpen={categoryModal} onClose={() => setCategoryModal(false)} title={editingCategory ? 'Edit Category' : 'New Category'} size="sm">
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Category Name *</label>
            <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} className="input-base" placeholder="e.g. Starters" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} className="input-base resize-none" rows={2} placeholder="Optional" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setCategoryModal(false)}>Cancel</Button>
            <Button onClick={saveCategory}>{editingCategory ? 'Update' : 'Add Category'}</Button>
          </div>
        </div>
      </Modal>

      {/* Item Modal */}
      <Modal isOpen={itemModal} onClose={() => setItemModal(false)} title={editingItem ? 'Edit Menu Item' : 'New Menu Item'} size="lg">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Item Name *</label>
              <input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} className="input-base" placeholder="e.g. Duck Confit" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Price *</label>
              <input type="number" step="0.01" min="0" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} className="input-base" placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} className="input-base resize-none" rows={2} placeholder="Describe the dish" />
          </div>
          <ImageUpload onUpload={url => setItemForm(f => ({ ...f, imageUrl: url }))} currentUrl={itemForm.imageUrl} folder="menu" label="Item Photo" />
          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { key: 'isAvailable', label: 'Available' },
              { key: 'isSpicy', label: '🌶 Spicy' },
              { key: 'isVegetarian', label: '🌿 Vegetarian' },
              { key: 'isGlutenFree', label: '✓ Gluten-Free' },
              { key: 'isFeatured', label: '⭐ Featured' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm[key as keyof typeof itemForm] as boolean}
                  onChange={e => setItemForm(f => ({ ...f, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setItemModal(false)}>Cancel</Button>
            <Button onClick={saveItem}>{isAssistant ? 'Submit for Approval' : (editingItem ? 'Update Item' : 'Add Item')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteConfirm?.type === 'category' ? 'Category' : 'Item'}`}
        message="This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  )
}
