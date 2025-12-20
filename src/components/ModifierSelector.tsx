import React, { useState, useEffect } from 'react';

interface ModifierGroup {
  id: number;
  menu_item_id: number;
  name: string;
  type: 'single' | 'multiple';
  is_required: boolean;
  display_order: number;
  options: ModifierOption[];
}

interface ModifierOption {
  id: number;
  modifier_group_id: number;
  name: string;
  price_adjustment: number;
  display_order: number;
  is_available: boolean;
}

interface ModifierSelectorProps {
  itemId: number;
  onSelectionChange: (selections: { [groupId: number]: number[] }) => void;
  selectedModifiers?: { [groupId: number]: number[] };
}

export default function ModifierSelector({ itemId, onSelectionChange, selectedModifiers = {} }: ModifierSelectorProps) {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModifierGroups();
  }, [itemId]);

  const fetchModifierGroups = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/api/menu/modifiers/items/${itemId}/groups`);
      const data = await response.json();
      setModifierGroups(data.groups || []);
    } catch (err) {
      setError('Failed to load modifiers');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionToggle = (groupId: number, optionId: number) => {
    const currentSelections = selectedModifiers[groupId] || [];
    const group = modifierGroups.find(g => g.id === groupId);
    if (!group) return;

    let newSelections: number[];

    if (group.type === 'single') {
      // Single selection: replace current selection
      newSelections = currentSelections.includes(optionId) ? [] : [optionId];
    } else {
      // Multiple selection: toggle
      newSelections = currentSelections.includes(optionId)
        ? currentSelections.filter(id => id !== optionId)
        : [...currentSelections, optionId];
    }

    const newSelectedModifiers = {
      ...selectedModifiers,
      [groupId]: newSelections,
    };

    onSelectionChange(newSelectedModifiers);
  };

  const getTotalModifierPrice = () => {
    let total = 0;
    Object.entries(selectedModifiers).forEach(([groupId, optionIds]) => {
      const group = modifierGroups.find(g => g.id === parseInt(groupId));
      if (group) {
        optionIds.forEach(optionId => {
          const option = group.options.find(o => o.id === optionId);
          if (option) {
            total += option.price_adjustment;
          }
        });
      }
    });
    return total;
  };

  const validateSelections = () => {
    const errors: string[] = [];
    modifierGroups.forEach(group => {
      const selections = selectedModifiers[group.id] || [];
      if (group.is_required && selections.length === 0) {
        errors.push(`${group.name} is required`);
      }
    });
    return errors;
  };

  if (loading) {
    return <div className="p-4 text-center">Loading modifiers...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (modifierGroups.length === 0) {
    return null; // No modifiers to show
  }

  const validationErrors = validateSelections();

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-lg font-medium mb-4">Customize Your Order</h3>

      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-sm font-medium">Please select required options:</p>
          <ul className="text-red-700 text-sm mt-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {modifierGroups.map((group) => {
          const selectedOptions = selectedModifiers[group.id] || [];

          return (
            <div key={group.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">
                  {group.name}
                  {group.is_required && <span className="text-red-500 ml-1">*</span>}
                </h4>
                <span className="text-sm text-gray-500 capitalize">
                  {group.type} {group.is_required ? '(required)' : '(optional)'}
                </span>
              </div>

              <div className="space-y-2">
                {group.options
                  .filter(option => option.is_available)
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((option) => {
                    const isSelected = selectedOptions.includes(option.id);

                    return (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type={group.type === 'single' ? 'radio' : 'checkbox'}
                            name={`group-${group.id}`}
                            checked={isSelected}
                            onChange={() => handleOptionToggle(group.id, option.id)}
                            className="mr-3"
                          />
                          <span className="font-medium">{option.name}</span>
                        </div>

                        {option.price_adjustment !== 0 && (
                          <span className={`font-medium ${
                            option.price_adjustment > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {option.price_adjustment > 0 ? '+' : ''}${option.price_adjustment.toFixed(2)}
                          </span>
                        )}
                      </label>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {getTotalModifierPrice() !== 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Modifier total:</span>
            <span className={`font-bold ${
              getTotalModifierPrice() > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {getTotalModifierPrice() > 0 ? '+' : ''}${getTotalModifierPrice().toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}