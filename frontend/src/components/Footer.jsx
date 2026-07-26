export default function Footer() {
  return (
    <footer className="app-footer">
      <p>
        © {new Date().getFullYear()} Snap2Find. Developed by <strong>Meet Patel</strong>.
      </p>
      <p>Contact: <a href="tel:7990273944">7990273944</a></p>
    </footer>
  );
}