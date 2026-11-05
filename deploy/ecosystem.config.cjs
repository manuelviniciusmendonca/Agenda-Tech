// ===============================================================
// PM2 - Agenda Tech API
// ===============================================================
// Uso no servidor:
//   cd /var/www/agendatech
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 save
//   pm2 startup
// ===============================================================

module.exports = {
    apps: [
        {
            name: "agendatech-api",
            cwd: "/var/www/agendatech/backend",
            script: "server.js",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            max_restarts: 10,
            max_memory_restart: "400M",
            watch: false,
            env: {
                NODE_ENV: "production",
                PORT: 3000,
            },
            out_file: "/var/log/agendatech/api.out.log",
            error_file: "/var/log/agendatech/api.err.log",
            time: true,
        },
    ],
};
