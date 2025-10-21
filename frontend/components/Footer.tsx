// @ts-nocheck
export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Medical De-Identification System. Built with Encore.ts.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Documentation
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              HIPAA Compliance
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
