# State Management Best Practices

## Preventing State Persistence Bugs

To avoid bugs where UI state is lost on page reload, follow these rules:

### 1. Default to Persisted State

**❌ DON'T use `useState` directly:**
```typescript
const [tab, setTab] = useState('TRACK'); // State lost on reload!
```

**✅ DO use `usePersistedState` or `useStorage`:**
```typescript
const [tab, setTab] = usePersistedState('timetracker.moe.currentTab', 'TRACK');
```

### 2. Be Explicit About Ephemeral State

If you really need state that resets on reload, use `useEphemeralState`:
```typescript
const [isDropdownOpen, setIsDropdownOpen] = useEphemeralState(false);
```

### 3. Storage Key Convention

Always use the pattern `timetracker.moe.{feature}`:
```typescript
// Good
const key = createStorageKey('currentTab'); // Returns: 'timetracker.moe.currentTab'

// Bad - don't hardcode
const key = 'currentTab'; // Missing namespace!
```

### 4. State Categories

**Always Persist:**
- User preferences (theme, settings)
- Current navigation state (active tab, selected filters)
- Work state (timer, active entry)
- Form data being edited

**Never Persist:**
- Dropdown/modal open states
- Hover states
- Loading states
- Animation states

### 5. Reducer Pattern

For complex state with reducers:
1. Use `useStorage` to get persisted state
2. Wait for `storageReady` before hydrating
3. Persist after hydration

See `useEntriesStore` and `useTimerStore` for examples. 