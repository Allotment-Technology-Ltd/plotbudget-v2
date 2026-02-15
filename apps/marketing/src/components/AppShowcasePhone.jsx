import AppPreview from './AppPreview';

/**
 * Phone frame content: static preview.
 * Videos support has been removed.
 */
export default function AppShowcasePhone({ variant = 'light' }) {
  return <AppPreview variant={variant} />;
}
