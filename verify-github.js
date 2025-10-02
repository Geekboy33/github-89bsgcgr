#!/usr/bin/env node

import https from 'https';

const GITHUB_REPO = 'https://api.github.com/repos/Geekboy33/marketmaker-pro';
const GITHUB_WEB = 'https://github.com/Geekboy33/marketmaker-pro';

function makeGitHubRequest(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'MarketMaker-Pro-Checker/1.0'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data
                    });
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

async function verifyGitHubRepo() {
    console.log('🔍 Verificando repositorio en GitHub...\n');
    
    try {
        console.log('📡 Consultando GitHub API...');
        const result = await makeGitHubRequest(GITHUB_REPO);
        
        if (result.statusCode === 200) {
            const repo = result.data;
            
            console.log('✅ ¡REPOSITORIO ENCONTRADO!\n');
            
            console.log('📊 INFORMACIÓN DEL REPOSITORIO:');
            console.log(`   📁 Nombre: ${repo.name}`);
            console.log(`   👤 Owner: ${repo.owner.login}`);
            console.log(`   📝 Descripción: ${repo.description || 'Sin descripción'}`);
            console.log(`   🌐 URL: ${repo.html_url}`);
            console.log(`   📅 Creado: ${new Date(repo.created_at).toLocaleDateString()}`);
            console.log(`   🔄 Actualizado: ${new Date(repo.updated_at).toLocaleDateString()}`);
            console.log(`   ⭐ Stars: ${repo.stargazers_count}`);
            console.log(`   🍴 Forks: ${repo.forks_count}`);
            console.log(`   👁️  Watchers: ${repo.watchers_count}`);
            console.log(`   📏 Tamaño: ${repo.size} KB`);
            console.log(`   🔓 Público: ${repo.private ? 'No' : 'Sí'}`);
            console.log(`   📋 Lenguaje principal: ${repo.language || 'No detectado'}`);
            
            if (repo.topics && repo.topics.length > 0) {
                console.log(`   🏷️  Topics: ${repo.topics.join(', ')}`);
            }
            
            console.log('\n🌐 ENLACES:');
            console.log(`   📖 Repositorio: ${repo.html_url}`);
            console.log(`   📋 Issues: ${repo.html_url}/issues`);
            console.log(`   🔀 Pull Requests: ${repo.html_url}/pulls`);
            console.log(`   📊 Insights: ${repo.html_url}/pulse`);
            
            if (repo.has_pages) {
                console.log(`   🌍 GitHub Pages: https://${repo.owner.login}.github.io/${repo.name}`);
            }
            
            console.log('\n📁 CONTENIDO:');
            console.log(`   📄 README: ${repo.has_readme ? '✅ Presente' : '❌ Faltante'}`);
            console.log(`   📜 Licencia: ${repo.license ? repo.license.name : '❌ Sin licencia'}`);
            console.log(`   🔒 .gitignore: Probablemente presente`);
            
            // Verificar commits
            console.log('\n🔄 Verificando commits...');
            try {
                const commitsResult = await makeGitHubRequest(`${GITHUB_REPO}/commits`);
                if (commitsResult.statusCode === 200 && Array.isArray(commitsResult.data)) {
                    const commits = commitsResult.data;
                    console.log(`   📝 Total commits: ${commits.length}`);
                    if (commits.length > 0) {
                        const lastCommit = commits[0];
                        console.log(`   🕐 Último commit: ${lastCommit.commit.message}`);
                        console.log(`   👤 Por: ${lastCommit.commit.author.name}`);
                        console.log(`   📅 Fecha: ${new Date(lastCommit.commit.author.date).toLocaleString()}`);
                    }
                }
            } catch (e) {
                console.log('   ⚠️  No se pudieron obtener los commits');
            }
            
            console.log('\n🎉 ¡VERIFICACIÓN EXITOSA!');
            console.log('✅ Tu proyecto MarketMaker Pro está correctamente subido a GitHub');
            
        } else if (result.statusCode === 404) {
            console.log('❌ REPOSITORIO NO ENCONTRADO');
            console.log('\n🔍 Posibles causas:');
            console.log('   1. El repositorio no existe');
            console.log('   2. El repositorio es privado');
            console.log('   3. El nombre del usuario o repositorio es incorrecto');
            console.log('\n💡 Soluciones:');
            console.log('   1. Verifica la URL: https://github.com/Geekboy33/marketmaker-pro');
            console.log('   2. Asegúrate de haber subido el código con git push');
            console.log('   3. Verifica que el repositorio sea público');
            
        } else {
            console.log(`❌ ERROR HTTP: ${result.statusCode}`);
            console.log('Respuesta:', result.data);
        }
        
    } catch (error) {
        console.log('💥 ERROR DE CONEXIÓN:');
        console.log(`   ${error.message}`);
        console.log('\n🌐 Verifica tu conexión a internet');
        console.log('🔄 Intenta nuevamente en unos momentos');
    }
    
    console.log('\n' + '='.repeat(60));
}

// Ejecutar verificación
verifyGitHubRepo().catch(console.error);