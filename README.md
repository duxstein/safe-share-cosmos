# 🔐 BlockVault

<div align="center">

**Decentralized Secure File Sharing Platform**

*Your files, your control, your ownership*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![IPFS](https://img.shields.io/badge/IPFS-65C2CB?logo=ipfs&logoColor=white)](https://ipfs.io/)
[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?logo=ethereum&logoColor=white)](https://ethereum.org/)

</div>

---

## 📖 Overview

**BlockVault** is a cutting-edge decentralized file sharing platform that combines the power of IPFS (InterPlanetary File System) for distributed storage with Ethereum smart contracts for immutable access control. Built with modern web technologies, BlockVault provides a secure, transparent, and censorship-resistant solution for file sharing.

### Key Highlights

- 🔒 **Blockchain-Based Access Control** - Smart contracts ensure only authorized users can access your files
- 🌐 **Decentralized Storage** - Files stored on IPFS, distributed across the network
- 👥 **Granular Permissions** - Whitelist, blacklist, and fine-grained access management
- 🏢 **Organization Support** - Manage files and permissions at the organizational level
- 🔐 **Wallet Integration** - Seamless MetaMask integration for Web3 authentication
- ⚡ **Modern UI** - Beautiful, responsive interface built with React and shadcn/ui

---

## ✨ Features

### Core Functionality

- **Secure File Upload**
  - Upload files to IPFS via Pinata gateway
  - Automatic file hash generation and blockchain registration
  - Support for multiple file types and sizes

- **Smart Contract Access Control**
  - Grant/revoke access to specific wallet addresses
  - Whitelist mode for exclusive access
  - Blacklist functionality to prevent unauthorized access
  - Real-time permission checking

- **File Management**
  - View your uploaded files
  - See files shared with you
  - Download files with IPFS gateway fallback
  - Track file ownership and permissions

- **Organization Management**
  - Create and manage organizations
  - Share files within organizations
  - Role-based access control

- **IPFS Configuration**
  - Multiple gateway support for redundancy
  - Service status monitoring
  - Automatic fallback to alternative gateways

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **React Router** - Client-side routing
- **Web3.js** - Ethereum blockchain interaction

### Backend & Infrastructure
- **Supabase** - Authentication and backend services
- **IPFS** - Decentralized file storage
- **Pinata** - IPFS pinning service
- **Ethereum** - Smart contract platform

### Smart Contracts
- **Solidity 0.8.0+** - Smart contract language
- **Ethereum Virtual Machine** - Contract execution

---

## 🏗️ Architecture

```
┌─────────────────┐
│   React Frontend │
│  (BlockVault UI) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐  ┌──▼──────┐
│ IPFS  │  │Ethereum │
│Storage│  │Contract │
└───────┘  └─────────┘
    │           │
    │      ┌────▼────┐
    │      │MetaMask│
    │      │ Wallet │
    │      └────────┘
    │
┌───▼──────────┐
│   Supabase   │
│  (Auth/API)  │
└──────────────┘
```

### Data Flow

1. **File Upload**: User uploads file → IPFS (via Supabase Edge Function) → Returns IPFS hash
2. **Registration**: IPFS hash → Ethereum smart contract → File ownership recorded on-chain
3. **Access Control**: Owner grants access → Smart contract updates permissions → Authorized users can access
4. **File Retrieval**: Authorized user requests file → IPFS gateway → File downloaded

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **MetaMask** browser extension
- **Supabase** account (for authentication and IPFS edge functions)
- **Pinata** account (for IPFS pinning) - [Get API keys](https://app.pinata.cloud/)
- **Ethereum wallet** with testnet ETH (Sepolia recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/safe-share-cosmos.git
   cd safe-share-cosmos
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase Edge Function**
   
   Deploy the IPFS upload function:
   ```bash
   supabase functions deploy ipfs-upload
   ```
   
   Add Pinata API keys as secrets:
   ```bash
   supabase secrets set PINATA_API_KEY=your_pinata_api_key
   supabase secrets set PINATA_SECRET_KEY=your_pinata_secret_key
   ```

5. **Deploy Smart Contract**
   
   See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.
   
   Quick steps:
   - Deploy `FileSharing.sol` to Sepolia testnet using Remix IDE
   - Update `CONTRACT_ADDRESS` in `src/services/contractService.ts`

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to `http://localhost:5173`

---

## 📝 Configuration

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Add them to your `.env.local` file
4. Set up authentication (Email/Password recommended)

### IPFS Configuration

1. Create a Pinata account at [pinata.cloud](https://pinata.cloud)
2. Generate API keys from the Pinata dashboard
3. Add keys as Supabase secrets (see Installation step 4)
4. The app will automatically use Pinata for IPFS uploads

### Smart Contract Configuration

1. Deploy the contract to your preferred network (Sepolia for testing)
2. Update the contract address in `src/services/contractService.ts`
3. Ensure your MetaMask is connected to the same network

---

## 💻 Usage

### Uploading Files

1. Connect your MetaMask wallet
2. Ensure IPFS service is configured (check IPFS Settings)
3. Click "Upload File" and select your file
4. Wait for upload to IPFS and blockchain registration
5. File is now available in your file manager

### Sharing Files

1. Navigate to your uploaded file
2. Enter the recipient's wallet address
3. Click "Grant Access"
4. Confirm the transaction in MetaMask
5. The recipient can now access the file

### Managing Permissions

- **Whitelist Mode**: Enable to restrict access to only whitelisted users
- **Blacklist**: Prevent specific addresses from accessing files
- **Revoke Access**: Remove access from previously authorized users

### Organizations

1. Create an organization from the Organization Manager
2. Invite members by wallet address
3. Share files within the organization
4. Manage organization-level permissions

---

## 🔧 Smart Contract Functions

### Core Functions

| Function | Description | Gas Cost (approx.) |
|----------|-------------|-------------------|
| `uploadFile(fileHash)` | Register a file on the blockchain | ~100,000 |
| `grantAccess(fileHash, user)` | Grant access to a user | ~50,000 |
| `revokeAccess(fileHash, user)` | Revoke user access | ~30,000 |
| `hasAccess(fileHash, user)` | Check if user has access | Free (view) |

### Advanced Functions

- `addToBlacklist(fileHash, user)` - Block a user from accessing
- `removeFromBlacklist(fileHash, user)` - Unblock a user
- `addToWhitelist(fileHash, user)` - Add user to whitelist
- `toggleWhitelistMode(fileHash)` - Enable/disable whitelist mode
- `getAuthorizedUsers(fileHash)` - Get all authorized users
- `getFileOwner(fileHash)` - Get file owner address

For complete contract documentation, see [contracts/FileSharing.sol](./contracts/FileSharing.sol)

---

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Project Structure

```
safe-share-cosmos/
├── contracts/           # Solidity smart contracts
├── src/
│   ├── components/      # React components
│   │   └── ui/         # shadcn/ui components
│   ├── contexts/        # React contexts (Auth, Web3)
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # Third-party integrations
│   ├── pages/          # Page components
│   ├── services/       # Business logic services
│   └── types/          # TypeScript type definitions
├── supabase/
│   ├── functions/      # Edge functions
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

---

## 🔒 Security Considerations

### Best Practices

- **Never commit private keys** - Use environment variables
- **Test on testnets first** - Always test smart contracts before mainnet
- **Verify contract code** - Use Etherscan verification for transparency
- **Use hardware wallets** - For production deployments
- **Regular audits** - Consider professional smart contract audits

### Known Limitations

- Files on IPFS require pinning for persistence
- Gas costs apply for all blockchain transactions
- IPFS gateway availability depends on network health
- Smart contract upgrades require careful migration planning

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all checks pass before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [IPFS](https://ipfs.io/) - Decentralized storage protocol
- [Ethereum](https://ethereum.org/) - Smart contract platform
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Pinata](https://pinata.cloud/) - IPFS pinning service
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Vite](https://vitejs.dev/) - Build tool

---

## 📞 Support

- **Documentation**: Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment help
- **Issues**: Open an issue on [GitHub Issues](https://github.com/yourusername/safe-share-cosmos/issues)
- **Discussions**: Join discussions in [GitHub Discussions](https://github.com/yourusername/safe-share-cosmos/discussions)

---

## 🗺️ Roadmap

- [ ] File encryption before IPFS upload
- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] File versioning
- [ ] Batch operations for gas optimization
- [ ] Mobile app (React Native)
- [ ] Decentralized identity integration
- [ ] NFT-based file ownership
- [ ] Advanced analytics dashboard

---

<div align="center">

**Built with ❤️ by the open source community**

⭐ Star this repo if you find it helpful!

</div>

