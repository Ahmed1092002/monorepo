# Modal Components Documentation

This package provides a comprehensive set of reusable modal components for React applications.

## Base Modal Component

The `Modal` component is the foundation for all other modal components. It provides extensive customization options.

### Basic Usage

```tsx
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
} from "@monorepo/shared-ui";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <ModalHeader>
        <h2>Modal Title</h2>
      </ModalHeader>
      <ModalContent>
        <p>Modal content goes here</p>
      </ModalContent>
      <ModalFooter>
        <button onClick={() => setIsOpen(false)}>Close</button>
      </ModalFooter>
    </Modal>
  );
}
```

### Modal Props

| Prop                  | Type       | Default     | Description                                                         |
| --------------------- | ---------- | ----------- | ------------------------------------------------------------------- |
| `isOpen`              | boolean    | -           | Controls modal visibility                                           |
| `onClose`             | () => void | -           | Callback when modal closes                                          |
| `children`            | ReactNode  | -           | Modal content                                                       |
| `size`                | string     | "md"        | Modal size (xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, full) |
| `className`           | string     | ""          | Additional CSS classes for modal                                    |
| `overlayClassName`    | string     | ""          | Additional CSS classes for overlay                                  |
| `showCloseButton`     | boolean    | true        | Show/hide close button                                              |
| `closeOnOverlayClick` | boolean    | true        | Close when clicking overlay                                         |
| `closeOnEscape`       | boolean    | true        | Close when pressing Escape                                          |
| `preventScroll`       | boolean    | true        | Prevent body scroll when open                                       |
| `animation`           | string     | "fade"      | Animation type (fade, slide, scale, none)                           |
| `position`            | string     | "center"    | Modal position (center, top, bottom)                                |
| `zIndex`              | number     | 50          | Z-index value                                                       |
| `closeButtonPosition` | string     | "top-right" | Close button position                                               |
| `customCloseButton`   | ReactNode  | -           | Custom close button component                                       |
| `onAfterOpen`         | () => void | -           | Callback after modal opens                                          |
| `onAfterClose`        | () => void | -           | Callback after modal closes                                         |
| `isRTL`               | boolean    | false       | Right-to-left support                                               |
| `role`                | string     | "dialog"    | ARIA role                                                           |
| `ariaLabel`           | string     | -           | ARIA label                                                          |
| `ariaLabelledBy`      | string     | -           | ARIA labelled by                                                    |
| `ariaDescribedBy`     | string     | -           | ARIA described by                                                   |

## Pre-built Modal Components

### ConfirmModal

A modal for confirmation dialogs with customizable variants.

```tsx
import { ConfirmModal } from "@monorepo/shared-ui";

<ConfirmModal
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleConfirm}
  title="Delete Item"
  message="Are you sure you want to delete this item?"
  variant="danger"
  confirmText="Delete"
  cancelText="Cancel"
/>;
```

### FormModal

A modal wrapper for forms with built-in form handling.

```tsx
import { FormModal } from "@monorepo/shared-ui";

<FormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Create User"
  submitText="Create"
  cancelText="Cancel"
>
  <input name="name" placeholder="Name" />
  <input name="email" placeholder="Email" />
</FormModal>;
```

### DeleteConfirmModal

A specialized modal for delete confirmations with password protection.

```tsx
import { DeleteConfirmModal } from "@monorepo/shared-ui";

<DeleteConfirmModal
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleDelete}
  title="Delete Item"
  message="This action cannot be undone."
  demoPassword="supervisor"
/>;
```

### SearchModal

A modal for search functionality with input field and optional content.

```tsx
import { SearchModal } from "@monorepo/shared-ui";

<SearchModal
  isOpen={isOpen}
  onClose={onClose}
  onSearch={handleSearch}
  title="Search Items"
  placeholder="Enter search term..."
  searchButtonText="Search"
>
  {/* Optional search results */}
</SearchModal>;
```

### LoadingModal

A modal for displaying loading states.

```tsx
import { LoadingModal } from "@monorepo/shared-ui";

<LoadingModal
  isOpen={isLoading}
  title="Processing..."
  message="Please wait while we process your request."
  allowClose={false}
/>;
```

### LogoutModal

A modal for logout options with hold shift and logout choices.

```tsx
import { LogoutModal } from "@monorepo/shared-ui";

<LogoutModal
  isOpen={isOpen}
  onClose={onClose}
  onHoldShift={handleHoldShift}
  onLogout={handleLogout}
  title="Logout Options"
  isRTL={isRTL}
/>;
```

## Supporting Components

### Text Component

A flexible text component with variants and styling options.

```tsx
import { Text } from "@monorepo/shared-ui";

<Text variant="h1" color="primary" weight="bold" align="center">
  Heading Text
</Text>;
```

### Input Component

An enhanced input component with validation and styling.

```tsx
import { Input } from "@monorepo/shared-ui";

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={emailError}
  helperText="We'll never share your email"
  variant="default"
  size="md"
/>;
```

### Select Component

A select component with options and validation.

```tsx
import { Select } from "@monorepo/shared-ui";

<Select
  label="Role"
  options={[
    { value: "admin", label: "Administrator" },
    { value: "user", label: "User" },
  ]}
  error={roleError}
/>;
```

## Advanced Usage Examples

### Custom Modal with Animation

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  size="lg"
  animation="slide"
  position="top"
  onAfterOpen={() => console.log("Modal opened")}
  onAfterClose={() => console.log("Modal closed")}
>
  {/* Content */}
</Modal>
```

### RTL Support

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  isRTL={true}
  closeButtonPosition="top-left"
>
  {/* Content */}
</Modal>
```

### Custom Close Button

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  customCloseButton={
    <button className="custom-close-btn">
      <CustomIcon />
    </button>
  }
>
  {/* Content */}
</Modal>
```

### Full Screen Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  size="full"
  animation="slide"
  position="center"
>
  {/* Full screen content */}
</Modal>
```

## CSS Classes

The modal components use the following CSS classes that can be customized:

- `.modal-overlay` - The backdrop overlay
- `.animate-fade-in` - Fade in animation
- `.animate-slide-in` - Slide in animation
- `.animate-scale-in` - Scale in animation
- `.modal-scrollbar` - Custom scrollbar styling

## Accessibility Features

- ARIA attributes for screen readers
- Focus management
- Keyboard navigation support
- Escape key handling
- Proper semantic HTML structure

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers
- RTL language support
- Responsive design
