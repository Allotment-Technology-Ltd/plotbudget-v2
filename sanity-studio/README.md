# Sanity Blogging Content Studio

Congratulations, you have now installed the Sanity Content Studio, an open-source real-time content editing environment connected to the Sanity backend.

Now you can do the following things:

- [Read “getting started” in the docs](https://www.sanity.io/docs/introduction/getting-started?utm_source=readme)
- Check out the example frontend: [React/Next.js](https://github.com/sanity-io/tutorial-sanity-blog-react-next)
- [Read the blog post about this template](https://www.sanity.io/blog/build-your-own-blog-with-sanity-and-next-js?utm_source=readme)
- [Join the Sanity community](https://www.sanity.io/community/join?utm_source=readme)
- [Extend and build plugins](https://www.sanity.io/docs/content-studio/extending?utm_source=readme)

## CI/CD

Schema deployment runs on every push to `main` (see `.github/workflows/release.yml`). To enable it:

1. In [Sanity Manage](https://sanity.io/manage), open your project → **API** → **Deploy tokens**.
2. Create a deploy token (name it e.g. “GitHub Actions”).
3. In GitHub: **Settings** → **Secrets and variables** → **Actions** → add secret **`SANITY_AUTH_TOKEN`** with the token value.

The workflow runs: `SANITY_AUTH_TOKEN=<token> npx sanity schema deploy`. For full documentation see [Schema deployment](https://www.sanity.io/docs/apis-and-sdks/schema-deployment).
