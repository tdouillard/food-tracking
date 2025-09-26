# Theming & Dark Mode

This project uses CSS custom properties (variables) for all colors, backgrounds, borders, and shadows. This makes it easy to update the look and feel of the app by changing a few variables in one place.

## Theme Variables

All theme variables are defined in `src/style.css` under the `:root` selector. Example:

```
:root {
  --color-primary: #4caf50;
  --color-secondary: #6c757d;
  --color-danger: #dc3545;
  --color-surface: #ffffff;
  --color-background: #f5f5f5;
  --color-border: #ddd;
  --color-text: #333;
  ...
}
```

## Dark Mode

Dark mode is supported automatically via the user's system preference using `prefers-color-scheme: dark`. You can also force dark mode by adding the `theme-dark` class to the `<body>` element. Example:

```
<body class="theme-dark">
  ...
</body>
```

This will override the theme regardless of system settings.

## Customizing the Theme

To change the color palette, edit the variables in `src/style.css`. For example, to change the primary color:

```
:root {
  --color-primary: #ff5722;
}
```

To adjust dark mode colors, update the variables inside the `@media (prefers-color-scheme: dark)` block or the `.theme-dark` body selector.

## Adding More Themes

You can add more themes by defining additional classes (e.g., `.theme-high-contrast`) and overriding the same variables.

## Example Variable List

- `--color-primary`
- `--color-secondary`
- `--color-danger`
- `--color-warning`
- `--color-success`
- `--color-surface`
- `--color-background`
- `--color-border`
- `--color-text`
- `--color-text-muted`
- `--color-shadow`
- `--radius-md`
- `--transition-base`

## Usage in Components

All CSS and inline styles reference these variables. To update the app's look, change the variables in one place.

---

For advanced theming (e.g., user theme toggle, persistence), see the comments in `src/style.css` and the theme toggle logic in the JS files.
