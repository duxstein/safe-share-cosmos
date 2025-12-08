import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Globe, 
  Lock, 
  Zap, 
  Users, 
  FileCheck, 
  ArrowRight, 
  ChevronRight,
  Database,
  Key,
  Layers
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-success/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl cosmic-gradient neon-glow">
                <Shield className="h-6 w-6 text-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                BlockVault
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="cosmic-gradient neon-glow text-foreground font-semibold">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border text-sm text-muted-foreground backdrop-blur-sm">
              <Zap className="h-4 w-4 text-warning" />
              <span>Powered by Ethereum & IPFS</span>
              <ChevronRight className="h-4 w-4" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-foreground">The Future of</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
                Secure File Sharing
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Store, share, and control your files with blockchain-powered security. 
              No intermediaries. No censorship. Complete ownership.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth">
                <Button size="lg" className="cosmic-gradient neon-glow text-foreground font-semibold px-8 py-6 text-lg">
                  Start Sharing Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-border hover:bg-card">
                <Globe className="mr-2 h-5 w-5 text-primary" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Decentralized</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">256-bit</div>
                <div className="text-sm text-muted-foreground">Encryption</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-success">∞</div>
                <div className="text-sm text-muted-foreground">Availability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why Choose <span className="text-primary">BlockVault</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the next generation of file sharing with cutting-edge Web3 technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="group glass-card p-8 rounded-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
              <div className="p-4 rounded-2xl bg-primary/10 w-fit mb-6 group-hover:neon-glow transition-all">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Smart Contract Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Access control powered by Ethereum smart contracts. Only authorized wallets can view your files.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group glass-card p-8 rounded-2xl hover:border-accent/50 transition-all duration-300 hover:-translate-y-1">
              <div className="p-4 rounded-2xl bg-accent/10 w-fit mb-6">
                <Database className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">IPFS Storage</h3>
              <p className="text-muted-foreground leading-relaxed">
                Files stored on the InterPlanetary File System. Distributed, redundant, and always accessible.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group glass-card p-8 rounded-2xl hover:border-success/50 transition-all duration-300 hover:-translate-y-1">
              <div className="p-4 rounded-2xl bg-success/10 w-fit mb-6">
                <Key className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Granular Permissions</h3>
              <p className="text-muted-foreground leading-relaxed">
                Whitelist, blacklist, and manage access at the wallet level. You decide who sees what.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group glass-card p-8 rounded-2xl hover:border-warning/50 transition-all duration-300 hover:-translate-y-1">
              <div className="p-4 rounded-2xl bg-warning/10 w-fit mb-6">
                <Users className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Team Management</h3>
              <p className="text-muted-foreground leading-relaxed">
                Import your organization members and manage file access across your entire team effortlessly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group glass-card p-8 rounded-2xl hover:border-destructive/50 transition-all duration-300 hover:-translate-y-1">
              <div className="p-4 rounded-2xl bg-destructive/10 w-fit mb-6">
                <FileCheck className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Immutable Records</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every file registration is permanently recorded on the blockchain. Tamper-proof history.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group glass-card p-8 rounded-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
              <div className="p-4 rounded-2xl bg-primary/10 w-fit mb-6">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Dual-Layer Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Blockchain as source of truth, database for speed. Best of both worlds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              How It <span className="text-accent">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg">Simple, secure, and decentralized</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full cosmic-gradient flex items-center justify-center mx-auto text-2xl font-bold text-foreground neon-glow">
                  1
                </div>
                <h3 className="text-xl font-semibold">Connect Wallet</h3>
                <p className="text-muted-foreground">
                  Link your MetaMask wallet to authenticate with the blockchain
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full cosmic-gradient flex items-center justify-center mx-auto text-2xl font-bold text-foreground neon-glow">
                  2
                </div>
                <h3 className="text-xl font-semibold">Upload Files</h3>
                <p className="text-muted-foreground">
                  Files are encrypted and stored on IPFS with a unique content hash
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full cosmic-gradient flex items-center justify-center mx-auto text-2xl font-bold text-foreground neon-glow">
                  3
                </div>
                <h3 className="text-xl font-semibold">Share Securely</h3>
                <p className="text-muted-foreground">
                  Grant access to specific wallet addresses through smart contracts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto glass-card rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 cosmic-gradient opacity-10" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Take Control of Your Files?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Join the decentralized revolution. Start sharing files with true ownership and security.
              </p>
              <Link to="/auth">
                <Button size="lg" className="cosmic-gradient neon-glow text-foreground font-semibold px-10 py-6 text-lg mt-4">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-card/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl cosmic-gradient">
                <Shield className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">BlockVault</span>
            </div>
            
            <p className="text-muted-foreground text-sm">
              Built with React, IPFS & Ethereum • Powered by Web3
            </p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4 text-primary" />
                IPFS
              </span>
              <span className="flex items-center gap-1">
                <Lock className="h-4 w-4 text-accent" />
                Ethereum
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
