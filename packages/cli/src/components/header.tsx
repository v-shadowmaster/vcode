export function Header() {
  return (
    <box
      width="100%"
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      gap={0.5}
    >
      <geist-text text="V" color="gray" rows={4} variant="solid" />
      <geist-text text="CODE" rows={4} variant="solid" />
    </box>
  );
}
