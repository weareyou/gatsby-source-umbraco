# Gatsby source Umbraco &middot; [![GitHub release (latest by date)](https://img.shields.io/github/v/release/weareyou/gatsby-source-umbraco)](https://github.com/weareyou/gatsby-source-umbraco/releases) [![GitHub license](https://img.shields.io/github/license/weareyou/gatsby-source-umbraco)](#license) ![dependencies](https://img.shields.io/david/weareyou/gatsby-source-umbraco) [![GitHub issues](https://img.shields.io/github/issues/weareyou/gatsby-source-umbraco)](https://github.com/weareyou/gatsby-source-umbraco/issues) ![last commit](https://img.shields.io/github/last-commit/weareyou/gatsby-source-umbraco)

A source plugin for pulling content and media from [Umbraco](https://umbraco.com/) into [Gatsby](https://www.gatsbyjs.org/).

This plugin is meant to be used when building a custom API on top of Umbraco—it requires the API to follow some [minimal conventions](#api-design). The plugin works great in combination with something like [Umbraco HeadRest](https://github.com/mattbrailsford/umbraco-headrest).

## Contents

- [Basic usage](#basic-usage)
- [Installation](#installation)
- [Advanced usage](#advanced-usage)
  - [Overlapping interface](#overlapping-interface)
  - [Loading remote files](#loading-remote-files)
  - [Relationships between nodes](#relationships-between-nodes)
  - [Namespacing types](#namespacing-types)
  - [Verbose logging](#verbose-logging)
- [How it works](#how-it-works)
  - [Loading content](#loading-content)
  - [Loading remote files](#loading-remote-files-1)
  - [Relationships between nodes](#relationships-between-nodes-1)
  - [Node metadata](#node-metadata)
  - [Overlapping interface](#overlapping-interface-1)
- [Configuration](#configuration)
- [API design](#api-design)
  - [Sitemap](#sitemap)
  - [Content items](#content-items)
- [Limitations](#limitations)
  - [Type discovery](#type-discovery)
  - [Multilingual](#multilingual)
  - [Protected API](#protected-api)
  - [Advanced usage of rich text editor](#advanced-usage-of-rich-text-editor)
- [Recipes](#recipes)
  - [Creating pages for content items](#creating-pages-for-content-items)
- [Tips](#tips)
  - [Absolute Media URL provider](#absolute-media-url-provider)
  - [Group content items using GraphQL interfaces](#group-content-items-using-graphql-interfaces)
- [License](#license)

## Basic usage

Like every [Gatsby plugin](https://www.gatsbyjs.org/docs/plugins/), the plugin has to be added and configured in the `plugins` array of the `gatsby-config.js` file. The source-umbraco plugin has only one required option: the URL of the Umbraco API (`url`). It is recommended to store this Umbraco API URL in an [environment variable](https://www.gatsbyjs.org/docs/environment-variables/).

```js
/* in gatsby-config.js */
module.exports = {
  plugins: [
    {
      resolve: "gatsby-source-umbraco",
      options: {
        url: process.env.UMBRACO_API_URL,
      },
    },
  ],
}
```

Provided that the API follows the [conventions](#api-design) required by the plugin, this will load the available content from the API and make it accessible to query via [Gatsby's GraphQL endpoint](https://www.gatsbyjs.org/docs/graphql/). You can now query your data by document type. Pro tip—use the [_GraphiQL_ interface]( https://www.gatsbyjs.org/docs/running-queries-with-graphiql/ ) available when running `gatsby develop` to explore your data and schema.

Consider the following example query. It assumes you have a document type `Textpage` with `title` and `subtitle` fields.

```graphql
query {
  allTextpage {
    nodes {
      title
      subtitle
    }
  }
}
```

Using this queries like this, you can [programmatically create pages](https://www.gatsbyjs.org/docs/creating-and-modifying-pages/) based on your data.

## Installation

The plugin is currently ***not*** available to install via a package manager. In Gatsby it is possible to load a plugin from a local directory. (See: [loading plugins from your local plugins folder](https://www.gatsbyjs.org/docs/loading-plugins-from-your-local-plugins-folder/).) You could pull this plugin's source code into a `gatsby-source-umbraco/` folder in the `plugins/` folder of your Gatsby project.

Perhaps make use of a [Git submodule](https://github.blog/2016-02-01-working-with-submodules/) in place of a proper package manager—for now.

## Advanced usage

Aside from simple data loading the plugin has several features to improve the integration between Umbraco and Gatsby. The following explains these features from an "implementation" point of view. For a more detailed explanation see: [how it works](#how-it-works).

### Overlapping interface

The plugin bases the [GraphQL types](https://graphql.org/learn/schema/) for the content items on their [document type](https://our.umbraco.com/documentation/tutorials/creating-basic-site/document-types/). The plugin also makes all types implement a common [GraphQL interface](https://graphql.org/learn/schema/#interfaces), this allows you to query all content items from Umbraco and access their common fields on a single type. Note that you need to configure the common fields (see [configuration](#configuration)) since this is dependent on the API implementation.

Consider the following example, it assumes that the API outputs `name` and `slug` fields for all content items.  On the Umbraco side of things, this data could come from the `Name` and `Url` properties of `IPublishedContent`. The plugin configuration in the example specifies that the interface (named `"UmbracoNode"` by default) has these two fields.

```js
{
  url: process.env.UMBRACO_API_URL,
  commonInterface: {
    fields: {
      name: "String",
      slug: "String",
    },
  },
}
```

The following query then selects these two fields for all the content nodes from Umbraco.

```graphql
query {
  allUmbracoNode {
    nodes {
      name
      slug
    }
  }
}
```

### Loading remote files

The plugin can download remote files, and turn them into [`File` nodes](https://www.gatsbyjs.org/packages/gatsby-source-filesystem/). This exposes the files to be transformed by other Gatsby plugins. A great example of this is the combination of image files and [gatsby-image]( https://www.gatsbyjs.org/packages/gatsby-image/ ). Downloading remote files also removes your site's dependency on the remote server.

While this is perfect for downloading and using [Umbraco media]( https://our.umbraco.com/documentation/Getting-Started/Backoffice/#media) in Gatsby, it can be used for files from any source. All you have to do is supply the URL for the file in your data. To tell the plugin that a key contains a file you have to suffix it with a special `remoteFileSuffix` (default is `___FILE` [note the 3 underscores], see [configuration](#configuration)). For example:

```json
{
  "image___FILE": "https://source.unsplash.com/43E513RKDug"
}
```

The plugin will download the file and make it available as a [`File` node](https://www.gatsbyjs.org/packages/gatsby-source-filesystem/). You can query for the field without the suffix, since the plugin will remove that. Consider the following query, it selects some metadata about the file as well as it's public URL, which can be used to render the image. (Although it is recommended to use [gatsby-image]( https://www.gatsbyjs.org/packages/gatsby-image/ ) for images.)

```graphql
query {
  someUmbracoType {
    image {
      name
      ext
      publicURL
    }
  }
}
```

This query would return:

```json
{
  "data": {
    "someUmbracoType": {
      "image": {
        "name": "someimage",
        "ext": ".jpg",
        "publicURL": "/static/filename.jpg"
      }
    }
  }
}
```

The plugin also knows how to handle arrays of files.

```json
{
  "reports___FILE": [
    "http://umbraco.local/media/zxodm2ol/report-v0.1.pdf",
    "http://umbraco.local/media/zxodm2ol/report-v0.2.pdf",
    "http://umbraco.local/media/zxodm2ol/report-v1.pdf"
  ]
}
```

These can be queried in a similar way.

```graphql
query {
  someUmbracoType {
    reports {
      publicURL
    }
  }
}
```

This query would return something like:

```json
{
  "data": {
    "someUmbracoType": {
      "reports": [
        { "publicURL": "/static/report-v0.1.jpg" },
        { "publicURL": "/static/report-v0.2.jpg" },
        { "publicURL": "/static/report-v1.jpg" }
      ]
    }
  }
}
```

Note that the URL to a file must be absolute, to enforce absolute URLs for all media items in Umbraco you could implement a custom `MediaUrlProvider`. (See [outbound request pipeline]( https://our.umbraco.com/documentation/reference/routing/request-pipeline/outbound-pipeline#urls ) on Our Umbraco.)

### Relationships between nodes

The plugin can create [foreign key relationships]( https://www.gatsbyjs.org/docs/node-creation/#node-relationship-storage-model ) between content items. This is useful in combination with Umbraco [property editors](https://our.umbraco.com/documentation/Getting-Started/Backoffice/Property-Editors/) like the [Content Picker](https://our.umbraco.com/documentation/Getting-Started/Backoffice/Property-Editors/Built-in-Property-Editors/Content-Picker/) or [Multinode Treepicker]( https://our.umbraco.com/documentation/Getting-Started/Backoffice/Property-Editors/Built-in-Property-Editors/Multinode-Treepicker/ ). It creates this relationship based on the ID of a content item, omitting the need to output data about the related content item in multiple places.

Consider the following example, it assumes you have two document types `Author` and `Article` that are set up in such a way that an article has 1 author, and an author can have 0 or more articles. To indicate that a field contains the ID of another content item that you want to link to you have to suffix it with a special `foreignKeySuffix` (default is `___ID` [note the 3 underscores], see [configuration](#configuration)). The data output for these content items might look like this:

```json
/* Article */
{
  "title": "A great little article",
  "author___ID": 123456
}

/* Author */
{
  "name": "John Appleseed",
  "articles___ID": [
    654321,
    123654,
    321456
  ]
}
```

Provided that all linked content items are imported into Gatsby by the plugin, it will link the items together. You can query for the fields without the suffix, since the plugin will remove it. Consider the following query, it finds the author and article by ID and selects some fields of the related items.

```graphql
query SampleQuery($authorID: ID!, $articleID: ID!) {
  author(id: {eq: $authorID}) {
    name
    articles {
      title
    }
  }
  article(id: {eq: $articleID}) {
    title
    author {
      name
    }
  }
}
```

The query would return something like:

```json
{
  "data": {
    "author": {
      "name": "John Appleseed",
      "articles": [
        { "title": "A great little article" },
        { "title": "..." },
        { "title": "..." }
      ]
    },
    "article": {
      "title": "A great little article",
      "author": {
        "name": "John Appleseed"
      }
    }
  }
}
```

Notice how this linking works both for singular and plural relationships.

### Namespacing types

The plugin bases the [GraphQL types](https://graphql.org/learn/schema/) for the content items on their [document type](https://our.umbraco.com/documentation/tutorials/creating-basic-site/document-types/). To avoid name clashes with types built in to Gatsby or created by other plugins, you can configure a `typePrefix`. The plugin will prepend every type name with this prefix.

See: [configuration](#configuration).

Consider the following example, in which the type prefix is configured to be "Umbraco". The plugin configuration will look like:

```js
{
  url: process.env.UMBRACO_API_URL,
  typePrefix: "Umbraco"
}
```

Given that you have a document type `Textpage` that has a field `name` you could run the following query:

```graphql
{
  umbracoTextpage {
    name
  }
  allUmbracoTextpage {
    nodes {
      name
    }
  }
}
```

### Verbose logging

By default the plugin only reports errors during the build process. For debugging purposes it is sometimes very useful to get more context around an error. For this purpose the plugin outputs verbose logging messages, these are hidden unless running the build/develop command using the `--verbose` flag.

```shell
gatsby develop --verbose
# or
gatsby build --verbose
```

## How it works

The following sequence diagram outlines the process of pulling content from Umbraco and supplying it to Gatsby. Below you'll find a more detailed explanation of the steps. In this diagram, "Umbraco" refers to your API.

<p align="center">
<image width="700" src="https://user-images.githubusercontent.com/15139826/69148741-4464f400-0ad5-11ea-8f66-5527f01872cf.jpeg" alt="Plugin overview sequence diagram" />
</p>

#### Loading content

In Umbraco, content is structured as nodes in the document tree. Every node is of a document type, and every document type defines properties of specific data types. The fact that the nodes are structured in a tree means that every node can have parent and child nodes.

In Gatsby, content is available as nodes via a GraphQL API. A source plugin can create new nodes, often (as is the case with this one), a plugin will create nodes based on data it downloads from a remote API. Once a node has been registered with Gatsby, it is available via the GraphQL API.

Note that the term node can mean two different things here. Going forward: nodes in Umbraco will mostly be referred to as Umbraco nodes, and nodes in Gatsby will just be referred to as nodes.

To pull the content from Umbraco into Gatsby, the plugin needs to know what nodes exist in Umbraco and how it can load the data (properties/fields) of these nodes. The plugin solves this using a sitemap (of sorts) that contains basic data for every Umbraco node.

```json
{
  "root": {
    "id": 1062,
    "urlSegment": "",
    "type": "homepage",
    "children": [
      {
        "id": 1066,
        "urlSegment": "about",
        "type": "textpage",
        "children": []
      }
    ]
  }
}
```

Notice how the sitemap resembles the structure of the document tree: every node can have a set of child nodes, starting from a root node. The path from which to load the data of each node is constructed using the `urlSegment` properties. This path structure resembles [the one native to Umbraco](https://our.umbraco.com/Documentation/Reference/Routing/Request-Pipeline/) and makes this plugin work very well with [Umbraco HeadRest](https://github.com/mattbrailsford/umbraco-headrest).

Once the plugin knows what Umbraco nodes exist and how to load them, it can start fetching. The data can be any valid JSON object, for example:

```json
{
  "title": "Hello World!",
  "meta": {
    "stars": 1000,
    "private": false
  },
  "contributors": [
    "John Appleseed",
    "Jane Appleseed"
  ]
}
```

Before the node is registered with Gatsby, the plugin loads remote files and handles foreign key fields.

#### Loading remote files

To load remote files the plugin scans the incoming data for key names suffixed by the `remoteFileSuffix`. The plugin scans nested arrays and objects too. When it encounters such a field it downloads the file and turns it into a `File` node using [`createRemoteFileNode`](https://www.gatsbyjs.org/packages/gatsby-source-filesystem/#createremotefilenode), as outlined in the diagram below. The field is then replaced with a link to the created `File` node.

<p align="center">
<image width="500" src="https://user-images.githubusercontent.com/15139826/69326768-a5fb9e80-0c4c-11ea-9751-7a5d64337586.jpeg" alt="Diagram that outlines the process of loading a remote file." />
</p>

For example, the data for the following example Umbraco node contains a URL to an image file (`image___FILE`). The file is downloaded and the field is replaced with a [reference](https://www.gatsbyjs.org/docs/schema-gql-type#foreign-key-reference-___node) to the created `File` node (`image___NODE`).

```json
{
  "title": "Gatsby source Umbraco",
  "image___FILE": "https://source.unsplash.com/43E513RKDug"
}
```

If a remote file field contains an array of file URLs, the plugin attempts to download and transform each file. For example, the following remote file field would be valid:

```json
{
  "title": "Gatsby source Umbraco",
  "media___FILE": [
    "https://source.unsplash.com/43E513RKDug",
    "https://source.unsplash.com/qL25vQrdd3Y",
    "https://source.unsplash.com/5oyFrBF33Q4"
  ]
}
```

#### Relationships between nodes

The plugin scans the incoming data for key names suffixed by the `foreignKeySuffix` too. When it encounters such a field, the plugin assumes it contains a Umbraco node ID and replaces the field with a link to the node in Gatsby. To do this, the plugin has to transform the ID from Umbraco the same way it transforms the ID when registering the node in the first place.

For example, the data for the following example Umbraco node contains a foreign key field `author___ID`. This ID is transformed and the field is replaced with a [reference](https://www.gatsbyjs.org/docs/schema-gql-type#foreign-key-reference-___node) to the node at that ID (`author___NODE`).

```json
{
  "title": "Building your own Gatsby plugin",
  "publishDate": "2019-10-17T00:00:00",
  "author___ID": 123456
}
```

Just as with remote files, this works for arrays of IDs too. For example:

```json
{
  "name": "John Appleseed",
  "articles___ID": [
    654321,
    123123,
    321654
  ]
}
```

Note that in order for this to work, the node that is referenced to must be available to Gatsby. This means that it should be loaded by the plugin and thus part of the sitemap etc. (See [loading content](#loading-content).)

#### Node metadata

The `id` and `type` properties from the sitemap are used for the ID and type of the node, respectively—that way, these properties don't have to be included in the data of each node. To make sure the ID is unique, it is passed through Gatsby's [`createNodeId`](https://www.gatsbyjs.org/docs/node-api-helpers/#createNodeId) helper function. The type name is capitalized and prepended by the `typePrefix`.

After the preparation steps, the data of a node, returned by the Umbraco API, is merged with the node metadata. Note that the key names used by [Gatsby's Node interface](https://www.gatsbyjs.org/docs/node-interface/) are reserved.

#### Overlapping interface

While creating and registering nodes, the plugin keeps track of all the types it encounters. Once all of the nodes are in the system, the plugin creates a [GraphQL interface](https://graphql.org/learn/schema/#interfaces) and makes sure all types registered by the plugin implement it. The interface is set up to be a [`@nodeInterface`](https://www.gatsbyjs.org/docs/schema-customization/#queryable-interfaces-with-the-nodeinterface-extension), meaning it is treated as a regular top-level node type. The name and fields of the interface can be configured.

## Configuration

The plugin allows for advanced configuration; the table below describes all configurable items. Most options have a default value and are therefore optional, allowing for a simple initial setup.

| Option                   | Description                                                  |   Type   |     Default     |
| :----------------------- | :----------------------------------------------------------- | :------: | :-------------: |
| `url`                    | The base URL of your Umbraco API. Relative URLs are prepended with this base URL. Under the hood, this is passed to [axios](https://github.com/axios/axios). The URL must be valid and reachable. | `String` |        -        |
| `sitemapRoute`           | The URL from which to load the sitemap data, it must be a valid route or URL. | `String` |   `"sitemap"`   |
| `typePrefix`             | String to prefix all type names with. This prefix can be used to avoid name clashes with types native to Gatsby or types created by other plugins. <br> This prefix does not impact `commonInterface.name`. | `String` |      `""`       |
| `commonInterface.name`   | The name of the common interface, it must be a string of at least one character. | `String` | `"UmbracoNode"` |
| `commonInterface.fields` | An object containing field definitions for the common interface. Every key is used as the field name and every value as the field type. Types must be valid [GraphQL types](https://graphql.org/learn/schema/). Note that the plugin only validates the types to be strings, issues with the types will be reported by Gatsby/GraphQL. | `Object` |      `{}`       |
| `remoteFileSuffix`       | The suffix used to identify remote file fields in the data returned by the API, it must be a string of at least one character. | `String` |   `"___FILE"`   |
| `foreignKeySuffix`       | The suffix used to identify remote file fields in the data returned by the API, it must be a string of at least one character. | `String` |    `"___ID"`    |

Consider the following code snippet, it contains an example configuration that specifies all of the available options:

```js
{
  url: "https://your-umbraco-api.io",
  sitemapRoute: "sitemap",
  typePrefix: "Umbraco",
  commonInterface: {
    name: "UmbracoNode",
    fields: {
      name: "String",
      slug: "String"
    }
  },
  remoteFileSuffix: "___FILE",
  foreignKeySuffix: "___ID"
}
```

## API design

As mentioned in the introduction, this plugin is meant to be used when building a custom API on top of Umbraco—it requires the API to follow some conventions. The plugin attempts to keep these conventions as minimal as possible to allow flexibility. That being said, the plugin was build using [Umbraco HeadRest]( https://github.com/mattbrailsford/umbraco-headrest ) to implement the API on the backend (to have a prototype to test against), this may have impacted some design decisions.

**Note that the plugin expects all data to be in JSON format.**

#### Sitemap

As explained in the "[how it works](#loading-content)" section, the plugin expects a sitemap of sorts to indicate what nodes exist in Umbraco and how it can load the data for these nodes. Data from this sitemap is also used as metadata of when creating Gatsby nodes (see: [node metadata](#node-metadata)). The route from which this data is loaded is configurable and defaults to `/sitemap`. (See: [configuration](#configuration).)

The format for this sitemap is based on Umbraco's document tree. The plugin expects each node in the sitemap to contain `id`, `type`, and `urlSegment` properties. When a node in Umbraco has children they should be output as sitemap nodes as well.

The sitemap must start at a `root` property. Every node (starting at `root` going down each level of `children`) in the sitemap is validated against the following rules:

- `id` must be either a number, or a string of at least 1 character.
- `type` must be a string
- `urlSegment` must be a string
- `children` must be an array of objects, these objects are later validated against the same rules.

Consider the following sitemap, it contains two nodes, a root node of type `Homepage` and a node of type `Textpage` nested below it.

```json
{
  "root": {
    "id": 1062,
    "urlSegment": "",
    "type": "homepage",
    "children": [
      {
        "id": 1066,
        "urlSegment": "about",
        "type": "textpage",
        "children": []
      }
    ]
  }
}
```

#### Content items

As explained in the "[how it works](#how-it-works)" section, the data for each content item is loaded from a URL. The returned JSON object becomes the data of the node in Gatsby's GraphQL API. Consider the following best practices when building your API.

- Your API should not nest the data of a content item in some unnecessarily.
- The endpoint for a content item should only return data for that specific content item.

- Content items of the same type should have (roughly) the same properties. Gatsby will try to infer the shape of a type based on the data it encounters, if two items of the same type have different properties the GraphQL schema will think every item of that type has _all_ properties which might be weird.

Consider the following example data.

```json
{
  "name": "Home",
  "slug": "/",
  "title": "Gatsby source Umbraco",
  "navigationLinks": [
    {
      "name": "Home",
      "url": "/"
    },
    {
      "name": "About",
      "url": "/about/"
    }
  ]
}
```

Note that it is OK to have nested objects and arrays in the data.

Again, this plugin works great in combination with [Umbraco HeadRest]( https://github.com/mattbrailsford/umbraco-headrest ), which "converts the Umbraco front-end into a REST API by passing content models through a mapping to create serializable view models." In this case the view model describes the data structure of a content item, and with that the structure of the node in Gatsby's GraphQL schema.

## Limitations

### Type discovery

As explained in the "[how it works](#loading-content)" section, the plugin creates GraphQL types based on the data available from the API. The plugin loads each item listed on the sitemap and creates a node of the appropriate type for it. The data shape of a type is [inferred by Gatsby](https://www.gatsbyjs.org/docs/schema-gql-type/), based on the available data.

The plugin only knows of types that it encounters. If there are no content items of a document type (yet) the type is not picked up by Gatsby, meaning the type is not available to query. Querying for a type that does not exist will cause an error that stops Gatsby's build process.

Consider the following situation in which this problem occurs:

Let's say you are building a website that has a blog. In your local environment, you start by creating the document types, then some example blog posts for testing. You then move on to implement the frontend: you start your Gatsby development environment which syncs the data from Umbraco, making the new type available. You create a template for your blog post  (which includes a query). Everything works well.

You decide to deploy the backend changes to a staging environment, here, the customer is responsible for writing content so you don't sync the example blog posts to this environment. You attempt to build the Gatsby frontend, which points to this staging environment of Umbraco, but this fails. The type you created is not available to Gatsby. The staging environment will not reflect the latest changes until a blog post is added.

A similar problem can occur with nullable fields. If no content items of a given type have a value for a certain field, the field is never encountered by Gatsby and therefore not included in the type definition. Querying for a field that does not exist will cause an error that stops Gatsby's build process.

##### Workaround

This limitation is inherent to the way this plugin works. One way to get around it would be to add a new feature to this plugin that communicates with the Umbraco API about the available types. This would require some sort of data format. Programmatically getting and outputting this data on the backend might be a difficult. Requiring type definitions will increase the amount of time needed to get up and running.

A simpler workaround is to just tell Gatsby what the types will look like. This can be done by implementing the [`createSchemaCustomization`](https://www.gatsbyjs.org/docs/node-apis/#createSchemaCustomization) hook in the `gatsby-node.js` file in the root of a Gatsby project. Consider the following example which assumes you have a document type `BlogPost` and adds an explicit type definition for it.

```js
/* in gatsby-node.js */
exports.createSchemaCustomization = gatsby => {
  const typeDefs = `
    type BlogPost @dontInfer {
      id: ID!
      title: String
      ...
    }
  `
  gatsby.actions.createTypes(typeDefs)
}
```

Note the [`@dontInfer`](https://www.gatsbyjs.org/docs/schema-customization/#opting-out-of-type-inference) directive, this tells Gatsby to not use [automatic type inference](https://www.gatsbyjs.org/docs/schema-customization/#automatic-type-inference) for this type.

By default Gatsby handles creating relational properties and formatting date properties automatically using conventions. When explicitly defining types Gatsby can't take care of this. You can use the `@link` and `@dateformat` extensions to make this easy. Consider the following type definition, it contains a date and a relational property.

```graphql
type ExampleType {
  publishDate: Date @dateformat
  image: File @link(from: "image___NODE")
}
```

See: "[schema customization > extensions and directives](https://www.gatsbyjs.org/docs/schema-customization/#extensions-and-directives)" and the [`createTypes`](https://www.gatsbyjs.org/docs/actions/#createTypes) documentation.

It is possible to build a custom way to load type definitions from your Umbraco API outside of the plugin. A very simple example of this would be to download a file containing the type definitions in the GraphQL schema definition language and pass that to Gatsby inside a project's `gatsby-node.js` file.

### Multilingual

Umbraco 8 has introduces an awesome way to handle multilingual content called [Language Variants](https://our.umbraco.com/documentation/getting-started/Backoffice/Variants/). How this might work in combination with Gatsby and this plugin has not been thought out yet. It is currently not possible for a node to exist in multiple languages, and therefore this plugin is ***not*** compatible with [Umbraco Language Variants](https://our.umbraco.com/documentation/getting-started/Backoffice/Variants/).

### Protected API

Currently, there is no way to configure the plugin to use any form of auth credentials. If your API is protected by some form of authentication, the plugin will likely encounter some [4xx HTTP errors]( https://httpstatuses.com/ ) (like 401 unauthorized, or 403 forbidden) and crash.

### Advanced usage of rich text editor

Umbraco has a built-in [Rich Text Editor]( https://our.umbraco.com/documentation/getting-started/backoffice/property-editors/Built-in-Property-Editors/Rich-Text-Editor/ ). While simpler usage of the rich text editor works fine, more advanced usage might cause some unexpected behavior.

A concrete example of such a limitation is with images. As discussed in the "[advanced usage](#loading-remote-files)" section, the plugin can make download files and make them to Gatsby. The plugin can't, however, do the same for images that are inlined in the rich text editor.

## Recipes

### Creating pages for content items

This plugin takes care of loading content and media from a custom Umbraco API into Gatsby. Once the data is available you probably want to create pages. In Gatsby you can [programmatically create pages](https://www.gatsbyjs.org/docs/programmatically-create-pages-from-data/). When doing so you have access to Gatsby's GraphQL schema, and with that, the all the data loaded by the plugin.

##### Prerequisites

* Every content item output by your Umbraco API contains a `slug` field. The plugin is configured so that the [common interface](#overlapping-interface) contains this `slug` field.
* There are `BlogPost` and `Textpage` document types in Umbraco and these are output correctly by your Umbraco API. At least 1 content item per type is available via your Umbraco API.

##### Directions

To programmatically create pages in Gatsby you have to implement the [`createPages`]( https://www.gatsbyjs.org/docs/node-apis/#createPages ) hook in your sites' `gatsby-node.js` file. Within that function you have access to the `graphql` function to query for the appropriate data, and the [`createPage`]( https://www.gatsbyjs.org/docs/actions/#createPage ) action.

The `createPage` action expects the path at which to create a page, a [template component]( https://www.gatsbyjs.org/docs/building-with-components/#page-template-components ), and some context for the page. Consider the example `gatsby-node.js` file below, which creates pages for all `UmbracoNode`s.

* All the `UmbracoNode`s have a `slug` field (see prerequisites) that can be used for the  path of the page. 
* The template for a page is dependent on the type of content, it is possible to query for this type and use it to determine what template is selected, in the example a `templates` object is used for mapping. `path.resolve` is used to turn a relative path into an absolute one, which is required by the [`createPage`]( https://www.gatsbyjs.org/docs/actions/#createPage ) action. Note that this code will crash if it encounters a `type` that is not present as a key in the `templates` object.
* The ID of the node is passed in the context object of the created page.

```js
/* in gatsby-node.js */

const path = require("path")

const templates = {
  Textpage: path.resolve("./src/templates/textpage.js"),
  BlogPost: path.resolve("./src/templates/blogPost.js"),
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  
  const result = await graphql(`
    query {
      allUmbracoNode {
        nodes {
          id
          slug
          type: __typename
        }
      }
    }
  `)
  
  const nodes = result.data.allUmbracoNode.nodes
  
  for (const node of nodes) {
    createPage({
      path: node.slug,
      context: { id: node.id },
      component: templates[node.type],
    })
  }
}
```

A page template consists of a query (see: [Querying Data in Pages with GraphQL](https://www.gatsbyjs.org/docs/page-query/)) and a [component](https://www.gatsbyjs.org/docs/building-with-components/#page-template-components) (React). The result of the query is passed to the component via the `data` [prop](https://reactjs.org/docs/components-and-props.html).

Gatsby uses the context object of a page for variables in page queries (see: [how to add query variables to a page query]( https://www.gatsbyjs.org/docs/page-query/#how-to-add-query-variables-to-a-page-query )). In the `gatsby-node.js` file, the `id` of a node is passed as the context, therefore it is accessible as a variable in the query (see: [GraphQL query variables]( https://graphql.org/learn/queries/#variables )). The query for the `Textpage` template uses the `$id` variable as an [argument]( https://graphql.org/learn/queries/#arguments ) on `textpage` to select a specific `Textpage` and ensure the page contains the correct data.

```jsx
/* in src/templates/textpage.js */

export default ({ data }) => {
  const { page } = data
  return (
    <div>
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.content }}></div>
    </div>
  )
}

export const query = graphql`
  query($id: ID!) {
    page: textpage(id: { eq: $id }) {
      title
      content
    }
  }
`
```

A similar template component for `BlogPost` in `src/templates/blogPost.js` is required, but omitted here for brevity.

## Tips

### Absolute Media URL provider

As mentioned in the "[loading remote files](#loading-remote-files)" section, the URL to a remote file must be absolute. By default, the `Url()` getter on a media item in Umbraco will return a relative URL. One way to get around this is by passing `UrlMode.Absolute` to the `.Url()` getter. Doing this everywhere in your code, however, isn't ideal.

Since Umbraco 8.1 it is possible to create a custom [`MediaUrlProvider`]( https://github.com/umbraco/Umbraco-CMS/pull/5282 ). You can create such a provider that hardcodes the `UrlMode` to be `Absolute`. Consider the following `AbsoluteMediaUrlProvider`, notice how `UrlMode.Absolute` is passed to the base class.

```csharp
namespace Way.Beheaded.Core.Composing.Providers
{
    using System;
    using Umbraco.Core.Models.PublishedContent;
    using Umbraco.Web;
    using Umbraco.Web.Routing;

    public class AbsoluteMediaUrlProvider : DefaultMediaUrlProvider
    {
        public override UrlInfo GetMediaUrl(UmbracoContext umbracoContext, IPublishedContent content, string propertyAlias, UrlMode mode, string culture, Uri current)
        {
            return base.GetMediaUrl(umbracoContext, content, propertyAlias, UrlMode.Absolute, culture, current);
        }
    }
}
```

Note that you still have to implement a [`composer`]( https://our.umbraco.com/documentation/Implementation/Composing/ ) to register this `AbsoluteMediaUrlProvider`.

### Group content items using GraphQL interfaces

The use of grouping Gatsby nodes using [GraphQL interfaces](https://graphql.org/learn/schema/#interfaces) is, in part, demonstrated by the [overlapping `UmbracoNode` interface](#overlapping-interface) that is already created by this plugin. In some scenario's it can be useful to group a subset of content items from Umbraco too. A concrete example of such a scenario is when you have a portfolio that contains several types of items like blog posts and case studies, but all with similar previews on a `/portfolio` page. In this case you could use a `PortfolioItem` interface so you can query for `allPortfolioItem`.

Another use case for creating extra GraphQL interfaces is with [`compositions`]( https://our.umbraco.com/documentation/Getting-Started/Data/Defining-content/#creating-a-document-type ). In Umbraco you can use compositions to share common fields between document types. In combination with [regular-](https://graphql.org/learn/queries/#fragments) or [inline fragments](https://graphql.org/learn/queries/#inline-fragments), an interface for such a composition could save a bunch of repetitive code.

You can use Gatsby's [`createSchemaCustomization `]( https://www.gatsbyjs.org/docs/node-apis/#createSchemaCustomization ) hook to define extra interfaces and make the appropriate types implement the appropriate interfaces. This is pretty straight forwards if you are already explicitly defining your types, as is the suggested workaround to the [type discovery limitation](#type-discovery) of this plugin, but it works just as well if you're not.

Consider the following example, in which an `UmbracoPage` interface is created and added to the `UmbracoHomepage` and `UmbracoTextpage` types.

```js
exports.createSchemaCustomization = gatsby => {
  const typeDefs = `
    interface UmbracoPage @nodeInterface {
      id: ID!
      slug: String
    }

    type UmbracoHomepage implements UmbracoPage @infer {
      id: ID!
      slug: String
    }

    type UmbracoTextpage implements UmbracoPage @infer {
      id: ID!
      slug: String
    }
  `
  gatsby.actions.createTypes(typeDefs)
}
```

Notice the `@infer` directive used on the type definitions. This directive tells Gatsby to continue using [automatic type inference]( https://www.gatsbyjs.org/docs/schema-customization/#automatic-type-inference ) for a type, that way your type definitions don't have to include all of the fields for each type, which keeps the code a bit more concise. The [`@nodeInterface`]( https://www.gatsbyjs.org/docs/schema-customization/#queryable-interfaces-with-the-nodeinterface-extension ) directive tells Gatsby to treat this interface as if it were a top-level node type, allowing you to query for it.

## License

gatsby-source-umbraco is [MIT licensed](./LICENSE).
