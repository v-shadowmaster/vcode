export function Header() {
  return (
    <box justifyContent="center" alignItems="center">
      <box
        flexDirection="row"
        justifyContent="center"
        gap={0.5}
        alignItems="center"
      >
        <geist-text text="V" color="gray" rows={4} variant="solid" />
        <geist-text text="CODE" rows={4} variant="solid" />
        <textarea focused />
      </box>
    </box>
  );
}
