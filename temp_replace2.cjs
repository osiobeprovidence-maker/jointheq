const fs = require('fs');
const path = 'c:/Users/USER/OneDrive/Desktop/jointheq/src/pages/DashboardPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `            default:
                return (
                    <div className="bg-[#f4f5f8] p-4 rounded-3xl mb-6">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Standard Access</div>
                        <p className="text-sm text-gray-500">
                            Open Chat Support to activate your slot or if you need any assistance getting started.
                        </p>
                    </div>
                );
        }
    };`;

const newBlock = `            default:
                if ((slot as any).login_email || (slot as any).login_password) {
                     return (
                         <div className="bg-[#f4f5f8] p-4 rounded-3xl mb-6">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Login Details</div>
                            <div className="p-3 bg-white rounded-xl font-mono text-[11px] mb-4 border border-black/5 flex flex-col gap-2">
                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Email</span>
                                    <span className="font-medium text-black break-all">{(slot as any).login_email || \`\${(slot as any).sub_name?.toLowerCase().replace(/\\s/g, '')}@jointheq.sbs\`}</span>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Password</span>
                                    <span className="font-medium text-black break-all">{(slot as any).login_password || 'Request from Support'}</span>
                                </div>
                            </div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instructions</div>
                            <p className="text-sm text-gray-500 mb-4">
                                Login using the credentials above. Open Chat Support to activate your slot or if you need any assistance getting started.
                            </p>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rules</div>
                            <ul className="text-sm space-y-2 text-black/60">
                                <li className="flex gap-2 items-start"><span className="text-red-400 text-xs mt-0.5">•</span> Do not change password</li>
                                <li className="flex gap-2 items-start"><span className="text-red-400 text-xs mt-0.5">•</span> Do not remove profiles</li>
                            </ul>
                         </div>
                     );
                }
                return (
                    <div className="bg-[#f4f5f8] p-4 rounded-3xl mb-6">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Standard Access</div>
                        <p className="text-sm text-gray-500">
                            Open Chat Support to activate your slot or if you need any assistance getting started.
                        </p>
                    </div>
                );
        }
    };`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully updated DashboardPage.tsx');
} else {
    // try to find just the default block
    console.log('Exact block not found. Trying fallback replacement...');
    const fallbackOld = `            default:\r\n                return (\r\n                    <div className="bg-[#f4f5f8] p-4 rounded-3xl mb-6">\r\n                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Standard Access</div>\r\n                        <p className="text-sm text-gray-500">\r\n                            Open Chat Support to activate your slot or if you need any assistance getting started.\r\n                        </p>\r\n                    </div>\r\n                );\r\n        }\r\n    };`;
    if (content.includes(fallbackOld)) {
        content = content.replace(fallbackOld, newBlock);
        fs.writeFileSync(path, content, 'utf8');
        console.log('Successfully updated DashboardPage.tsx with fallback fallback');
    } else {
        console.log("Could not find the target string whatsoever.");
    }
}
